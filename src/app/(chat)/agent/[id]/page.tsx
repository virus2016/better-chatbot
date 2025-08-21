import EditAgent from "@/components/agent/edit-agent";
import { agentRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  // For new agents, pass no initial data
  if (id === "new") {
    return <EditAgent userId={session.user.id} />;
  }

  // Fetch the agent data on the server
  const agent = await agentRepository.selectAgentById(id, session.user.id);

  if (!agent) {
    notFound();
  }

  const isOwner = agent.userId === session.user.id;
  const hasEditAccess = isOwner || agent.visibility === "public";

  return (
    <EditAgent
      key={id}
      initialAgent={agent}
      userId={session.user.id}
      isOwner={isOwner}
      hasEditAccess={hasEditAccess}
      isBookmarked={agent.isBookmarked || false}
    />
  );
}
