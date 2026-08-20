import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Any signed-in admin can view/manage the list of admin accounts.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const users = await prisma.adminUser.findMany({
    select: { id: true, username: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Please log in as admin." }, { status: 401 });

  const body = await req.json();
  const username = String(body.username || "").trim();
  const name = String(body.name || "").trim();
  const password = String(body.password || "");

  if (!username || !name || !password) {
    return NextResponse.json({ error: "Name, username and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: "That username is already taken." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({
    data: { username, name, passwordHash },
    select: { id: true, username: true, name: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
