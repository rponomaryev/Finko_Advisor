import { notFound, redirect } from "next/navigation";
import { InterviewPanel } from "@/components/advisor/InterviewPanel";
import { getServerSession } from "@/lib/server/auth";
import { getProjectForSession } from "@/lib/services/projectService";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session || session.role !== "user") redirect(`/demo-login?next=/advisor/projects/${id}`);

  const project = await getProjectForSession(id, session);

  if (!project) {
    notFound();
  }

  return <InterviewPanel initialProject={JSON.parse(JSON.stringify(project))} />;
}
