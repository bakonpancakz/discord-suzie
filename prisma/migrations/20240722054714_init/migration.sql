-- CreateTable
CREATE TABLE "UserBadges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "robloxUserId" BIGINT NOT NULL,
    "robloxBadgeId" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBadges_robloxBadgeId_robloxUserId_key" ON "UserBadges"("robloxBadgeId", "robloxUserId");
