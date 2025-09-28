'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Wallet, Eye, EyeOff } from 'lucide-react'

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SignInModal({ isOpen, onClose, onSuccess }: SignInModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  })
  const { publicKey, signMessage } = useWallet()

  const handleEmailSignIn = async (isSignUp: boolean = false) => {
    if (!formData.email && !formData.username) return
    
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        isSignUp: isSignUp.toString(),
        redirect: false
      })

      if (result?.ok) {
        onSuccess?.()
        onClose()
      } else {
        console.error('Sign in failed:', result?.error)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWalletSignIn = async () => {
    if (!publicKey || !signMessage) return

    setIsLoading(true)
    try {
      // Create a message to sign
      const message = `Sign in to Qognita with wallet: ${publicKey.toString()}`
      const encodedMessage = new TextEncoder().encode(message)
      
      // Sign the message
      const signature = await signMessage(encodedMessage)
      
      const result = await signIn('credentials', {
        publicKey: publicKey.toString(),
        signature: Buffer.from(signature).toString('base64'),
        message,
        redirect: false
      })

      if (result?.ok) {
        onSuccess?.()
        onClose()
      } else {
        console.error('Wallet sign in failed:', result?.error)
      }
    } catch (error) {
      console.error('Wallet sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Welcome to Qognita</DialogTitle>
          <DialogDescription className="text-gray-300">
            Sign in to access advanced features and connect your wallet
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="email" className="text-gray-300 data-[state=active]:text-white">
              Email/Username
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-gray-300 data-[state=active]:text-white">
              Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username (optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="pl-10 bg-slate-800 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pr-10 bg-slate-800 border-slate-600 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleEmailSignIn(false)}
                  disabled={isLoading || (!formData.email && !formData.username)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => handleEmailSignIn(true)}
                  disabled={isLoading || (!formData.email && !formData.username)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-300 hover:bg-slate-800"
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-gray-300">
                <Wallet className="h-5 w-5" />
                <span>Connect your Solana wallet to sign in</span>
              </div>
              
              <WalletMultiButton className="!w-full !bg-purple-600 hover:!bg-purple-700 !text-white !py-3 !px-6 !rounded-lg !transition-colors" />
              
              {publicKey && (
                <Button
                  onClick={handleWalletSignIn}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Signing In...' : 'Sign In with Wallet'}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300"
          >
            Continue as Guest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
