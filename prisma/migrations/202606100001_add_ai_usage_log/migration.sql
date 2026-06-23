CREATE TABLE "AIUsageLog" (
  "id" TEXT NOT NULL,
  "projectId" TEXT,
  "userId" TEXT,
  "operation" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "responseId" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "totalTokens" INTEGER,
  "webSearchUsed" BOOLEAN NOT NULL DEFAULT false,
  "webSearchCalls" INTEGER,
  "status" TEXT NOT NULL,
  "errorMessage" TEXT,
  "fallbackUsed" BOOLEAN NOT NULL DEFAULT false,
  "durationMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIUsageLog_projectId_idx" ON "AIUsageLog"("projectId");
CREATE INDEX "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");
CREATE INDEX "AIUsageLog_operation_idx" ON "AIUsageLog"("operation");
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");
