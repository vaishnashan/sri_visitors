import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const count = await prisma.adminUser.count();
  if (count <= 1) {
    return NextResponse.json({ error: "Can't delete the last remaining admin account." }, { status: 400 });
  }

  const id = Number(params.id);
  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
