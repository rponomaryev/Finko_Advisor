-- Add AI narrative report and web research payload storage for calculated projects.
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "aiReportData" JSONB;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "webResearchData" JSONB;
