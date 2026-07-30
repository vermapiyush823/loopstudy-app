import { cache } from "react";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { seedTopicsForUser } from "@/lib/topics/seed";

const { handlers, auth: uncachedAuth, signIn, signOut } = NextAuth({
  ...authConfig,
  events: {
    async createUser({ user }) {
      if (user.id) {
        await seedTopicsForUser(user.id);
      }
    },
  },
});

const auth = cache(uncachedAuth);

export { handlers, auth, signIn, signOut };
