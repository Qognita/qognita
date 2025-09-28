import Link from 'next/link'
import Image from 'next/image'
import { Shield, Home, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthButton } from '@/components/auth/AuthButton'

export function Header() {
  return (
    <header className="border-b border-white/10 bg-navy-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Image 
              src="/logo.svg" 
              alt="Qognita Logo" 
              width={32} 
              height={32} 
              className="text-blue-400"
            />
            <div>
              <h1 className="text-xl font-bold text-white font-raleway">Qognita</h1>
              <p className="text-xs text-gray-400">Powered by Morpheus & OpenAI</p>
            </div>
          </Link>

          {/* Spacer to push user profile to the right */}
          <div className="flex-1"></div>

          {/* User Profile - Far Right */}
          <div className="flex items-center">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}
