import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { fireAndForgetAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.active) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        if (user.organizationId) {
          fireAndForgetAudit({
            organizationId: user.organizationId,
            actorUserId: user.id,
            action: 'LOGIN_SUCCEEDED',
            entityType: 'user',
            entityId: user.id,
            metadata: { email: user.email, role: user.role },
          })
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId,
          speciality: user.speciality,
          specialty: user.specialty,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = user.role
        token.organizationId = user.organizationId
        token.speciality = user.speciality
        token.specialty = user.specialty
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role
        session.user.organizationId = token.organizationId as string | null | undefined
        session.user.speciality = token.speciality as string | null
        session.user.specialty = token.specialty as never
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
