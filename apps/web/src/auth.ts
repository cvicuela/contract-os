import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Persist encrypted refresh token to Supabase for Drive integration
      if (account?.provider === "google" && account.refresh_token && user.id) {
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/auth/save-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              refreshToken: account.refresh_token,
              accessToken: account.access_token,
            }),
          })
        } catch (err) {
          console.error("Failed to save Drive token:", err)
          // Non-fatal — user can still log in without Drive
        }
      }
      return true
    },
    async jwt({ token, account }) {
      if (account?.access_token) token.accessToken = account.access_token
      if (account?.refresh_token) token.refreshToken = account.refresh_token
      if (account?.expires_at) token.expiresAt = account.expires_at
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      if (session.user) session.user.id = token.sub!
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
