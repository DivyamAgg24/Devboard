/*
  Warnings:

  - The `cycleTime` column on the `PullRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PullRequest" DROP COLUMN "cycleTime",
ADD COLUMN     "cycleTime" DOUBLE PRECISION;
