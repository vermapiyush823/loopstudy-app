import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { seedTopicsForUser } from "@/lib/topics/seed";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    async createUser({ user }) {
      if (user.id) {
        await seedTopicsForUser(user.id);
      }
    },
  },
});
