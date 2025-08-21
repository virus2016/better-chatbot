import { agentRepository } from "lib/db/repository";
import { getSession } from "auth/server";
import { notFound } from "next/navigation";
import { AgentsList } from "@/components/agent/agents-list";

export default async function AgentsPage() {
  const session = await getSession();

  if (!session?.user.id) {
    notFound();
  }

  // Fetch agents data on the server
  const allAgents = await agentRepository.selectAgents(
    session.user.id,
    ["mine", "shared"],
    50,
  );

  // Separate into my agents and shared agents
  const myAgents = allAgents.filter(
    (agent) => agent.userId === session.user.id,
  );
  const sharedAgents = allAgents.filter(
    (agent) => agent.userId !== session.user.id,
  );

  return (
    <AgentsList
      initialMyAgents={myAgents}
      initialSharedAgents={sharedAgents}
      userId={session.user.id}
    />
  );
}
