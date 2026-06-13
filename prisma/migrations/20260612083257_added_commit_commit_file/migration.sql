-- CreateEnum
CREATE TYPE "PRSize" AS ENUM ('small', 'medium', 'large', 'xl');

-- DropForeignKey
ALTER TABLE "PullRequest" DROP CONSTRAINT "PullRequest_repoId_fkey";

-- AlterTable
ALTER TABLE "PullRequest" ADD COLUMN     "cycleTime" TIMESTAMP(3),
ADD COLUMN     "metricsComputedAt" TIMESTAMP(3),
ADD COLUMN     "prSize" "PRSize";

-- CreateTable
CREATE TABLE "Commit" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "commentCount" INTEGER,
    "message" TEXT NOT NULL,
    "additions" INTEGER,
    "deletions" INTEGER,
    "total" INTEGER,
    "authorLogin" TEXT,
    "authorEmail" TEXT NOT NULL,
    "committedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitFile" (
    "id" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "additions" INTEGER NOT NULL,
    "deletions" INTEGER NOT NULL,
    "changes" INTEGER NOT NULL,

    CONSTRAINT "CommitFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequestCommit" (
    "prId" TEXT NOT NULL,
    "commitId" TEXT NOT NULL,

    CONSTRAINT "PullRequestCommit_pkey" PRIMARY KEY ("prId","commitId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Commit_repoId_sha_key" ON "Commit"("repoId", "sha");

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "TrackedRepo"("githubRepoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "TrackedRepo"("githubRepoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitFile" ADD CONSTRAINT "CommitFile_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "Commit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestCommit" ADD CONSTRAINT "PullRequestCommit_prId_fkey" FOREIGN KEY ("prId") REFERENCES "PullRequest"("githubPrId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestCommit" ADD CONSTRAINT "PullRequestCommit_commitId_fkey" FOREIGN KEY ("commitId") REFERENCES "Commit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
