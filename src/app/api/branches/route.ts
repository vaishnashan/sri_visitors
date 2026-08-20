import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const division = searchParams.get("division");

  const rows = await prisma.branch.findMany({
    where: {
      ...(year ? { year: Number(year) } : {}),
      ...(division && division !== "all" ? { division } : {}),
    },
    orderBy: [{ year: "asc" }, { branch: "asc" }],
  });

  return NextResponse.json(rows);
}

function computeTotal(b: Record<string, number>) {
  return (
    (b.excellent || 0) +
    (b.good || 0) +
    (b.normal || 0) +
    (b.satisfaction || 0) +
    (b.unsatisfaction || 0) +
    (b.notRating || 0)
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const body = await req.json();
  if (!body.branch || !body.year || !body.division) {
    return NextResponse.json({ error: "Branch, year and division are required." }, { status: 400 });
  }

  const total = computeTotal(body);

  const row = await prisma.branch.create({
    data: {
      year: Number(body.year),
      division: body.division,
      branch: body.branch,
      excellent: Number(body.excellent) || 0,
      good: Number(body.good) || 0,
      normal: Number(body.normal) || 0,
      satisfaction: Number(body.satisfaction) || 0,
      unsatisfaction: Number(body.unsatisfaction) || 0,
      notRating: Number(body.notRating) || 0,
      male: Number(body.male) || 0,
      female: Number(body.female) || 0,
      total,
      isPlaceholder: false,
    },
  });

  return NextResponse.json(row, { status: 201 });
}
