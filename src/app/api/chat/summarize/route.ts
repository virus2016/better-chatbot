import { convertToCoreMessages, smoothStream, streamText } from "ai";
import { selectThreadWithMessagesAction } from "../actions";
import { getCustomModelProvider } from "lib/ai/models";
import { SUMMARIZE_PROMPT } from "lib/ai/prompts";
import logger from "logger";
import { ChatModel } from "app-types/chat";
import { redirect, RedirectType } from "next/navigation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { threadId, chatModel } = json as {
      threadId: string;
      chatModel?: ChatModel;
    };

    const thread = await selectThreadWithMessagesAction(threadId);

    if (!thread) redirect("/", RedirectType.replace);

    const messages = convertToCoreMessages(
      thread.messages
        .map((v) => ({
          content: "",
          role: v.role,
          parts: v.parts,
        }))
        .concat({
          content: "",
          parts: [
            {
              type: "text",
              text: "Generate a system prompt based on the conversation so far according to the rules.",
            },
          ],
          role: "user",
        }),
    );

    const result = streamText({
      model: (await getCustomModelProvider()).getModel(chatModel),
      system: SUMMARIZE_PROMPT,
      experimental_transform: smoothStream({ chunking: "word" }),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    logger.error(error);
  }
}
