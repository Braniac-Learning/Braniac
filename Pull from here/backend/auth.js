import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = {
          id: "1",
          email: "admin@example.com",
          password: "password123"
        }

        if (
          credentials.email === user.email &&
          credentials.password === user.password
        ) {
          return { id: user.id, email: user.email }
        }

        return null
      }
    })
  ],
  session: {
    strategy: "jwt"
  }
})
