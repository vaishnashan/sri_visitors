-- Add monthsCovered to Year, for fair partial-year comparisons
ALTER TABLE "Year" ADD COLUMN "monthsCovered" INTEGER NOT NULL DEFAULT 12;

-- Multiple named admin accounts (replaces single env-based admin login)
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");
