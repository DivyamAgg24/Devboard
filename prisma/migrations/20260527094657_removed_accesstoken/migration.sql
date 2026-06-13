/*
  Warnings:

  - You are about to drop the column `accessToken` on the `OAuthConnection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OAuthConnection" DROP COLUMN "accessToken";
