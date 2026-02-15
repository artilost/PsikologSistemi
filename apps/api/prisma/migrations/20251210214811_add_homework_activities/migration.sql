-- CreateTable
CREATE TABLE "homework_activities" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homework_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homework_activities_homeworkId_idx" ON "homework_activities"("homeworkId");

-- AddForeignKey
ALTER TABLE "homework_activities" ADD CONSTRAINT "homework_activities_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "homework_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
