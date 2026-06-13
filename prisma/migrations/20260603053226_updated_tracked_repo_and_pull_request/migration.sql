/*
  Warnings:

  - You are about to drop the column `refreshToken` on the `OAuthConnection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,githubRepoId]` on the table `TrackedRepo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "OAuthConnection" DROP COLUMN "refreshToken",
ADD COLUMN     "accessToken" TEXT;

-- AlterTable
ALTER TABLE "PullRequest" ADD COLUMN     "timeToFirstReview" INTEGER,
ADD COLUMN     "timeToMerge" INTEGER;

-- AlterTable
ALTER TABLE "TrackedRepo" ADD COLUMN     "githubRepoUrl" TEXT,
ADD COLUMN     "syncError" TEXT,
ADD COLUMN     "syncRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "TrackedRepo_userId_githubRepoId_key" ON "TrackedRepo"("userId", "githubRepoId");
