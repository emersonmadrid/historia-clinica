import { DefaultSession } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'
import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      speciality?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    speciality?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: Role
    speciality?: string | null
  }
}
