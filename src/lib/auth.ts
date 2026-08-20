import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Multi-admin login: each person has their own username + password, stored
// in the AdminUser table (passwords hashed with bcrypt, never stored in
// plain text). Any number of people can be signed in at the same time,
// each with their own session — add accounts from Manage Data -> Admin
// Users, or with `npm run create-admin -- "Full Name" username password`.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.adminUser.findUnique({
          where: { username: credentials.username.trim() },
        });
        if (!user) return null;

        const validPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!validPassword) return null;

        return { id: String(user.id), name: user.name, email: null };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.name = user.name;
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
