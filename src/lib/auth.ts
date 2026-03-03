import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[Auth] Authorize called with email:", credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials")
          return null
        }

        // Find user by email
        console.log("[Auth] Looking up user...")
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          console.log("[Auth] User not found")
          return null
        }
        console.log("[Auth] User found:", user.id)

        // Verify password from account
        console.log("[Auth] Looking up account...")
        const account = await prisma.account.findFirst({
          where: {
            userId: user.id,
            provider: 'credentials'
          }
        })

        if (!account || !account.access_token) {
          console.log("[Auth] Account not found or no access_token")
          return null
        }
        console.log("[Auth] Account found, checking password...")

        const isValid = await bcrypt.compare(credentials.password, account.access_token)
        console.log("[Auth] Password valid:", isValid)
        
        if (!isValid) {
          return null
        }

        console.log("[Auth] Login successful!")
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days for better security (was 30)
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
