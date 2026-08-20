-- CreateTable
CREATE TABLE "Year" (
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Year_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "division" TEXT NOT NULL DEFAULT 'Unassigned',
    "branch" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "excellent" INTEGER NOT NULL DEFAULT 0,
    "good" INTEGER NOT NULL DEFAULT 0,
    "normal" INTEGER NOT NULL DEFAULT 0,
    "satisfaction" INTEGER NOT NULL DEFAULT 0,
    "unsatisfaction" INTEGER NOT NULL DEFAULT 0,
    "notRating" INTEGER NOT NULL DEFAULT 0,
    "male" INTEGER NOT NULL DEFAULT 0,
    "female" INTEGER NOT NULL DEFAULT 0,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_year_idx" ON "Branch"("year");

-- CreateIndex
CREATE INDEX "Branch_division_idx" ON "Branch"("division");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_year_division_branch_key" ON "Branch"("year", "division", "branch");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_year_fkey" FOREIGN KEY ("year") REFERENCES "Year"("year") ON DELETE CASCADE ON UPDATE CASCADE;
