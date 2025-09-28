import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email/Username',
      credentials: {
        email: { label: 'Email', type: 'email' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        isSignUp: { label: 'Is Sign Up', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email && !credentials?.username) {
          return null
        }

        // For demo purposes, we'll accept any email/username
        // In production, you'd validate against your database
        try {
          const identifier = credentials.email || credentials.username
          const isSignUp = credentials.isSignUp === 'true'
          
          if (isSignUp) {
            // Handle sign up - in production, create user in database
            return {
              id: `user_${Date.now()}`,
              name: credentials.username || identifier?.split('@')[0],
              email: credentials.email || `${credentials.username}@qognita.local`,
              image: null,
            }
          } else {
            // Handle sign in - in production, verify credentials
            return {
              id: `user_${identifier}`,
              name: credentials.username || identifier?.split('@')[0],
              email: credentials.email || `${credentials.username}@qognita.local`,
              image: null,
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
        }

        return null
      },
    }),
    CredentialsProvider({
      name: 'Solana Wallet',
      credentials: {
        publicKey: { label: 'Public Key', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.publicKey || !credentials?.signature || !credentials?.message) {
          return null
        }

        // Here you would verify the Solana wallet signature
        // For demo purposes, we'll accept any valid-looking public key
        try {
          // Basic validation - in production, verify the signature
          if (credentials.publicKey.length >= 32) {
            return {
              id: credentials.publicKey,
              name: `${credentials.publicKey.slice(0, 4)}...${credentials.publicKey.slice(-4)}`,
              email: `${credentials.publicKey}@wallet.solana`,
              image: null,
              walletAddress: credentials.publicKey,
            }
          }
        } catch (error) {
          console.error('Wallet auth error:', error)
        }

        return null
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
}
