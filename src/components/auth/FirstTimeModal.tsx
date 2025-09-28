'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, User, Zap, Star } from 'lucide-react'
import { SignInModal } from './SignInModal'

interface FirstTimeModalProps {
  isOpen: boolean
  onClose: () => void
  onContinueAsGuest: () => void
}

export function FirstTimeModal({ isOpen, onClose, onContinueAsGuest }: FirstTimeModalProps) {
  const [showSignInModal, setShowSignInModal] = useState(false)

  const handleSignUp = () => {
    setShowSignInModal(true)
  }

  const handleContinueAsGuest = () => {
    onContinueAsGuest()
    onClose()
  }

  if (showSignInModal) {
    return (
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => {
          setShowSignInModal(false)
          onClose()
        }}
        onSuccess={() => {
          setShowSignInModal(false)
          onClose()
        }}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl text-white">Welcome to Qognita</DialogTitle>
          <DialogDescription className="text-gray-300">
            Get the most out of your Solana security analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits of signing up */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Sign up to unlock:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/20">
                  <User className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Wallet Connection</p>
                  <p className="text-sm text-gray-400">Connect your Solana wallet for enhanced features</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/20">
                  <Zap className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Analysis History</p>
                  <p className="text-sm text-gray-400">Track and review your past security analyses</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20">
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Advanced Features</p>
                  <p className="text-sm text-gray-400">Access premium analysis tools and insights</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleSignUp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              Sign Up / Sign In
            </Button>
            
            <Button
              onClick={handleContinueAsGuest}
              variant="outline"
              className="w-full border-slate-600 text-gray-300 hover:bg-slate-800 py-3"
            >
              Continue as Guest
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Guest mode provides basic analysis features. Sign up for the full experience.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
