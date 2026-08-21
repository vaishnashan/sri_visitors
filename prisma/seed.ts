/**
 * Seeds the database with:
 *  - REAL data for 2024/2025/2026 (2025 = exact figures from the original
 *    database.sql; 2024/2026 = reconstructed from the PDF reports), taken
 *    from source-data.json (ported from the Streamlit app's computed_data.json).
 *  - PLACEHOLDER division + male/female splits, generated deterministically
 *    (same seeded approach as the original Streamlit `data.py`) so numbers
 *    stay stable across reseeds. These are clearly flagged with
 *    isPlaceholder = true — replace with real numbers via Manage Data
 *    whenever you have them.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sourceData from "./source-data.json";

const prisma = new PrismaClient();

const CATEGORIES = ["excellent", "good", "normal", "satisfaction", "unsatisfaction", "not_rating"] as const;
const DIVISIONS = ["Karachchi", "Kandawalai", "Poonakary", "Pachchilaipalli"];

// Deterministic string-seeded PRNG (mulberry32) so re-running the seed
// always produces the same placeholder split.
function seededRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function splitIntegerRandomly(count: number, names: string[], seedKey: string): Record<string, number> {
  const rng = seededRandom(seedKey);
  const weights = names.map(() => 0.6 + rng() * 0.8); // uniform(0.6, 1.4)
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (count * w) / totalWeight);
  const floorVals = raw.map((x) => Math.floor(x));
  let remainder = count - floorVals.reduce((a, b) => a + b, 0);
  const order = names
    .map((_, i) => i)
    .sort((a, b) => raw[b] - floorVals[b] - (raw[a] - floorVals[a]));
  let idx = 0;
  while (remainder > 0) {
    floorVals[order[idx % order.length]] += 1;
    remainder--;
    idx++;
  }
  const out: Record<string, number> = {};
  names.forEach((n, i) => (out[n] = floorVals[i]));
  return out;
}

function genderSplit(seedKey: string, total: number) {
  const rng = seededRandom(seedKey);
  const maleRatio = 0.38 + rng() * 0.24; // uniform(0.38, 0.62)
  const male = Math.round(total * maleRatio);
  return { male, female: total - male };
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.branch.deleteMany();
  await prisma.year.deleteMany();

  const data = sourceData as Record<string, Record<string, Record<string, number>>>;
  const years = Object.keys(data).map(Number).sort();
  const latestYear = Math.max(...years);

  for (const year of years) {
    // The most recent year is assumed to still be in progress (partial data).
    // Adjust this any time from Manage Data -> Years once you know the exact
    // number of months of real data it has.
    const monthsCovered = year === latestYear ? 6 : 12;
    await prisma.year.create({ data: { year, monthsCovered } });
    const branches = data[String(year)];

    for (const [branchName, stats] of Object.entries(branches)) {
      const divisionParts: Record<string, Record<string, number>> = {};
      DIVISIONS.forEach((d) => (divisionParts[d] = {}));

      for (const cat of CATEGORIES) {
        const value = stats[cat] ?? 0;
        const split = splitIntegerRandomly(value, DIVISIONS, `${branchName}-${year}-${cat}`);
        for (const d of DIVISIONS) divisionParts[d][cat] = split[d];
      }

      for (const division of DIVISIONS) {
        const cats = divisionParts[division];
        const total =
          cats.excellent + cats.good + cats.normal + cats.satisfaction + cats.unsatisfaction + cats.not_rating;
        const { male, female } = genderSplit(`${branchName}-${year}-${division}`, total);

        await prisma.branch.create({
          data: {
            year,
            division,
            branch: branchName,
            total,
            excellent: cats.excellent,
            good: cats.good,
            normal: cats.normal,
            satisfaction: cats.satisfaction,
            unsatisfaction: cats.unsatisfaction,
            notRating: cats.not_rating,
            male,
            female,
            isPlaceholder: true, // division split + gender are generated, not real
          },
        });
      }
    }
    console.log(`Seeded year ${year} (${Object.keys(branches).length} branches x ${DIVISIONS.length} divisions)`);
  }

  // Seed one admin account if SEED_ADMIN_* env vars are set (optional —
  // you can always create accounts later with `npm run create-admin`).
  const seedUsername = process.env.SEED_ADMIN_USERNAME;
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  const seedName = process.env.SEED_ADMIN_NAME || "Administrator";
  if (seedUsername && seedPassword) {
    const passwordHash = await bcrypt.hash(seedPassword, 10);
    await prisma.adminUser.upsert({
      where: { username: seedUsername },
      update: { passwordHash, name: seedName },
      create: { username: seedUsername, passwordHash, name: seedName },
    });
    console.log(`Seeded admin account: ${seedName} (${seedUsername})`);
  } else {
    console.log(
      "No SEED_ADMIN_USERNAME/SEED_ADMIN_PASSWORD set — skipping admin account.\n" +
        'Create one with: npm run create-admin -- "Your Name" username YourPassword123'
    );
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
