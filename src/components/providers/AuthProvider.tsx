'use client'

import { SessionProvider } from 'next-auth/react'
import { SolanaWalletProvider } from './WalletProvider'

interface Props {
  children: React.ReactNode
}

export function AuthProvider({ children }: Props) {
  return (
    <SessionProvider>
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </SessionProvider>
  )
}
