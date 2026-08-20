import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const id = Number(params.id);
  const body = await req.json();
  const total = computeTotal(body);

  const row = await prisma.branch.update({
    where: { id },
    data: {
      branch: body.branch,
      division: body.division,
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

  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const id = Number(params.id);
  await prisma.branch.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
