import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ReportPreview } from "@/components/advisor/ReportPreview";
import { ReportPrintButton } from "@/components/advisor/ReportPrintButton";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getServerSession } from "@/lib/server/auth";
import { getProjectForSession } from "@/lib/services/projectService";
import { getTranslations } from "@/lib/i18n";
import { getReportLocale } from "@/lib/i18n/reportMessages";
import { localizeReportData } from "@/lib/report/localizeReport";

export const dynamic = "force-dynamic";

type ReportPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const session = await getServerSession();
  if (!session || session.role !== "user") redirect(`/demo-login?next=/advisor/projects/${id}/report`);

  const project = await getProjectForSession(id, session);

  if (!project) {
    notFound();
  }

  const existingProject = project;
  const rawReport = existingProject.reportData as any;
  const cookieStore = await cookies();
  const uiLocale = cookieStore.get("finko-locale")?.value;
  const locale = getReportLocale(existingProject as unknown as Record<string, unknown>, uiLocale);
  const report = rawReport ? localizeReportData(rawReport, locale) : null;
  const reportMessages = getTranslations(locale).report;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="no-print mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/advisor/projects/${existingProject.id}`}>
          <Button variant="outline">{reportMessages.backToDashboard}</Button>
        </Link>
        {report ? <ReportPrintButton projectId={existingProject.id} locale={locale} /> : null}
      </div>
      {report ? (
        <ReportPreview report={report} locale={locale} />
      ) : (
        <Card>
          <CardContent>
            <h1 className="text-2xl font-bold">{reportMessages.reportNotReady}</h1>
            <p className="mt-2 text-finko-muted">{reportMessages.exportNotReady}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
