import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
  type UIMessage,
  formatDataStreamPart,
  appendClientMessage,
  Message,
  Tool,
} from "ai";

import { getCustomModelProvider } from "lib/ai/models";

import { mcpClientsManager } from "lib/ai/mcp/mcp-manager";

import { chatRepository, workflowRepository } from "lib/db/repository";
import globalLogger from "logger";
import {
  buildMcpServerCustomizationsSystemPrompt,
  buildProjectInstructionsSystemPrompt,
  buildUserSystemPrompt,
  buildToolCallUnsupportedModelSystemPrompt,
  mentionPrompt,
} from "lib/ai/prompts";
import { chatApiSchemaRequestBodySchema } from "app-types/chat";

import { errorIf, safe } from "ts-safe";

import {
  appendAnnotations,
  excludeToolExecution,
  filterMCPToolsByMentions,
  handleError,
  manualToolExecuteByLastMessage,
  mergeSystemPrompt,
  convertToMessage,
  extractInProgressToolPart,
  assignToolResult,
  filterMCPToolsByAllowedMCPServers,
  filterMcpServerCustomizations,
  workflowToVercelAITools,
} from "./shared.chat";
import {
  generateTitleFromUserMessageAction,
  rememberMcpServerCustomizationsAction,
} from "./actions";
import { getSession } from "auth/server";
import { colorize } from "consola/utils";
import { isVercelAIWorkflowTool } from "app-types/workflow";
import { objectFlow } from "lib/utils";
import { APP_DEFAULT_TOOL_KIT } from "lib/ai/tools/tool-kit";

const logger = globalLogger.withDefaults({
  message: colorize("blackBright", `Chat API: `),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();

    const session = await getSession();

    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const {
      id,
      message,
      chatModel,
      toolChoice,
      allowedAppDefaultToolkit,
      autoTitle,
      allowedMcpServers,
      projectId,
      mentions = [],
    } = chatApiSchemaRequestBodySchema.parse(json);

    // Resolve model provider asynchronously
    const provider = await getCustomModelProvider();
    const model = provider.getModel(chatModel);
    const isToolCallUnsupportedModel = provider.isToolCallUnsupportedModel
      ? provider.isToolCallUnsupportedModel
      : (_m) => false;

    let thread = await chatRepository.selectThreadDetails(id);

    if (!thread) {
      logger.info(`create chat thread: ${id}`);
      const newThread = await chatRepository.insertThread({
        id,
        projectId: projectId ?? null,
        title: autoTitle
          ? await generateTitleFromUserMessageAction({ message, model })
          : "",
        userId: session.user.id,
      });
      thread = await chatRepository.selectThreadDetails(newThread.id);
    }

    if (thread!.userId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    // if is false, it means the last message is manual tool execution
    const isLastMessageUserMessage = message.role == "user";

    const previousMessages = (thread?.messages ?? []).map(convertToMessage);

    const messages: Message[] = isLastMessageUserMessage
      ? appendClientMessage({
          messages: previousMessages,
          message,
        })
      : previousMessages;

    const inProgressToolStep = extractInProgressToolPart(messages.slice(-2));

    const isToolCallAllowed =
      !isToolCallUnsupportedModel(model) &&
      (toolChoice != "none" || mentions.length > 0);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const mcpClients = await mcpClientsManager.getClients();
        logger.info(`mcp-server count: ${mcpClients.length}`);
        const MCP_TOOLS = await safe(mcpClientsManager.tools())
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .ifOk(async (tools) => {
            const mentionCounts = mentions.filter(
              (m) => m.type == "mcpServer" || m.type == "mcpTool",
            );
            const allowedMcpServerTools = Object.values(allowedMcpServers ?? {})
              .map((t) => t.tools)
              .flat();
            const needTools =
              mentionCounts.length || allowedMcpServerTools.length;
            if (needTools && Object.keys(tools).length === 0) {
              logger.warn("No MCP tools found, but MCP server is binding");
              await mcpClientsManager.init();
            }
          })
          .map((tools) => {
            // filter tools by mentions
            if (mentions.length) {
              return filterMCPToolsByMentions(tools, mentions);
            }
            // filter tools by allowed mcp servers
            return filterMCPToolsByAllowedMCPServers(tools, allowedMcpServers);
          })
          .orElse({});

        const WORKFLOW_TOOLS = await safe()
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map(() =>
            workflowRepository.selectToolByIds(
              mentions
                .filter((m) => m.type == "workflow")
                .map((v) => v.workflowId),
            ),
          )
          .map((v) => workflowToVercelAITools(v, dataStream))
          .orElse({});

        const APP_DEFAULT_TOOLS = safe(APP_DEFAULT_TOOL_KIT)
          .map(errorIf(() => !isToolCallAllowed && "Not allowed"))
          .map((tools) => {
            if (mentions.length) {
              const defaultToolMentions = mentions.filter(
                (m) => m.type == "defaultTool",
              );
              return Array.from(Object.values(tools)).reduce((acc, t) => {
                const allowed = objectFlow(t).filter((_, k) => {
                  return defaultToolMentions.some((m) => m.name == k);
                });
                return { ...acc, ...allowed };
              }, {});
            }
            return (
              allowedAppDefaultToolkit?.reduce(
                (acc, key) => {
                  return { ...acc, ...tools[key] };
                },
                {} as Record<string, Tool>,
              ) || {}
            );
          })
          .orElse({});

        if (inProgressToolStep) {
          const toolResult = await manualToolExecuteByLastMessage(
            inProgressToolStep,
            message,
            { ...MCP_TOOLS, ...WORKFLOW_TOOLS, ...APP_DEFAULT_TOOLS },
            request.signal,
          );
          assignToolResult(inProgressToolStep, toolResult);
          dataStream.write(
            formatDataStreamPart("tool_result", {
              toolCallId: inProgressToolStep.toolInvocation.toolCallId,
              result: toolResult,
            }),
          );
        }

        const userPreferences = thread?.userPreferences || undefined;

        const mcpServerCustomizations = await safe()
          .map(() => {
            if (Object.keys(MCP_TOOLS ?? {}).length === 0)
              throw new Error("No tools found");
            return rememberMcpServerCustomizationsAction(session.user.id);
          })
          .map((v) => filterMcpServerCustomizations(MCP_TOOLS!, v))
          .orElse({});

        const systemPrompt = mergeSystemPrompt(
          buildUserSystemPrompt(session.user, userPreferences),
          buildProjectInstructionsSystemPrompt(thread?.instructions),
          buildMcpServerCustomizationsSystemPrompt(mcpServerCustomizations),
          mentions.length > 0 && mentionPrompt,
          isToolCallUnsupportedModel(model) &&
            buildToolCallUnsupportedModelSystemPrompt,
        );

        const vercelAITooles = safe({ ...MCP_TOOLS, ...WORKFLOW_TOOLS })
          .map((t) => {
            const bindingTools =
              toolChoice === "manual" ? excludeToolExecution(t) : t;
            return {
              ...bindingTools,
              ...APP_DEFAULT_TOOLS, // APP_DEFAULT_TOOLS Not Supported Manual
            };
          })
          .unwrap();

        const allowedMcpTools = Object.values(allowedMcpServers ?? {})
          .map((t) => t.tools)
          .flat();

        logger.info(
          `tool mode: ${toolChoice}, mentions: ${mentions.length}, allowedMcpTools: ${allowedMcpTools.length}`,
        );
        logger.info(
          `binding tool count APP_DEFAULT: ${Object.keys(APP_DEFAULT_TOOLS ?? {}).length}, MCP: ${Object.keys(MCP_TOOLS ?? {}).length}, Workflow: ${Object.keys(WORKFLOW_TOOLS ?? {}).length}`,
        );
        logger.info(`model: ${chatModel?.provider}/${chatModel?.model}`);

        const result = streamText({
          model,
          system: systemPrompt,
          messages,
          maxSteps: 10,
          toolCallStreaming: true,
          experimental_transform: smoothStream({ chunking: "word" }),
          maxRetries: 1,
          tools: vercelAITooles,
          toolChoice: "auto",
          abortSignal: request.signal,
          onFinish: async ({ response, usage }) => {
            const appendMessages = appendResponseMessages({
              messages: messages.slice(-1),
              responseMessages: response.messages,
            });
            if (isLastMessageUserMessage) {
              await chatRepository.upsertMessage({
                threadId: thread!.id,
                model: chatModel?.model ?? null,
                role: "user",
                parts: message.parts,
                attachments: message.experimental_attachments,
                id: message.id,
                annotations: appendAnnotations(message.annotations, {
                  usageTokens: usage.promptTokens,
                }),
              });
            }
            const assistantMessage = appendMessages.at(-1);
            if (assistantMessage) {
              const annotations = appendAnnotations(
                assistantMessage.annotations,
                {
                  usageTokens: usage.completionTokens,
                  toolChoice,
                },
              );
              dataStream.writeMessageAnnotation(annotations.at(-1)!);
              await chatRepository.upsertMessage({
                model: chatModel?.model ?? null,
                threadId: thread!.id,
                role: assistantMessage.role,
                id: assistantMessage.id,
                parts: (assistantMessage.parts as UIMessage["parts"]).map(
                  (v) => {
                    if (
                      v.type == "tool-invocation" &&
                      v.toolInvocation.state == "result" &&
                      isVercelAIWorkflowTool(v.toolInvocation.result)
                    ) {
                      return {
                        ...v,
                        toolInvocation: {
                          ...v.toolInvocation,
                          result: {
                            ...v.toolInvocation.result,
                            history: v.toolInvocation.result.history.map(
                              (h) => {
                                return {
                                  ...h,
                                  result: undefined,
                                };
                              },
                            ),
                          },
                        },
                      };
                    }
                    return v;
                  },
                ),
                attachments: assistantMessage.experimental_attachments,
                annotations,
              });
            }
          },
        });
        result.consumeStream();
        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
        result.usage.then((useage) => {
          logger.debug(
            `usage input: ${useage.promptTokens}, usage output: ${useage.completionTokens}, usage total: ${useage.totalTokens}`,
          );
        });
      },
      onError: handleError,
    });
  } catch (error: any) {
    logger.error(error);
    return new Response(error.message, { status: 500 });
  }
}
