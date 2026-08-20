import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DIVISIONS = ["Karachchi", "Kandawalai", "Poonakary (Poonagary)", "Pachchilaipalli"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const years = await prisma.year.findMany({ orderBy: { year: "asc" } });

  // ?detail=true returns { year, monthsCovered } objects (used by Yearly
  // Comparison to normalize partial years). Plain GET keeps returning a
  // simple number[] so existing year dropdowns don't need to change.
  if (searchParams.get("detail") === "true") {
    return NextResponse.json(
      years.map((y: { year: number; monthsCovered: number }) => ({
        year: y.year,
        monthsCovered: y.monthsCovered,
      }))
    );
  }

  return NextResponse.json(years.map((y: { year: number }) => y.year));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const body = await req.json();
  const year = Number(body.year);
  const copyBranchesFromYear = body.copyBranchesFromYear ? Number(body.copyBranchesFromYear) : null;
  if (!year || year < 1900 || year > 3000) {
    return NextResponse.json({ error: "Enter a valid year." }, { status: 400 });
  }

  const existing = await prisma.year.findUnique({ where: { year } });
  if (existing) return NextResponse.json({ error: `Year ${year} already exists.` }, { status: 409 });

  const monthsCovered = Number(body.monthsCovered) || 12;
  await prisma.year.create({ data: { year, monthsCovered } });

  if (copyBranchesFromYear) {
    const sourceBranches = await prisma.branch.findMany({ where: { year: copyBranchesFromYear } });
    const branchNames = Array.from(new Set(sourceBranches.map((b: { branch: string }) => b.branch)));
    for (const name of branchNames) {
      for (const division of DIVISIONS) {
        await prisma.branch.create({
          data: { year, division, branch: name, isPlaceholder: false },
        });
      }
    }
  }

  return NextResponse.json({ success: true, year });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const body = await req.json();
  const year = Number(body.year);
  const monthsCovered = Number(body.monthsCovered);
  if (!year) return NextResponse.json({ error: "Missing year." }, { status: 400 });
  if (!monthsCovered || monthsCovered < 1 || monthsCovered > 12) {
    return NextResponse.json({ error: "Months covered must be between 1 and 12." }, { status: 400 });
  }

  await prisma.year.update({ where: { year }, data: { monthsCovered } });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  if (!year) return NextResponse.json({ error: "Missing year." }, { status: 400 });

  await prisma.year.delete({ where: { year } }); // cascades to branches
  return NextResponse.json({ success: true });
}
