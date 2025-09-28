'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logOut } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { AuthModal } from './AuthModal'
import { toast } from 'sonner'

export function AuthButton() {
  const { user, isAuthenticated, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignInClick = () => {
    setShowAuthModal(true)
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await logOut()
      if (error) {
        toast.error('Failed to sign out')
      } else {
        toast.success('Signed out successfully')
      }
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm text-gray-300">Loading...</span>
      </div>
    )
  }

  // User is signed in
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3">
        {/* User Profile Circle */}
        <div className="relative group">
          <button className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-2 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
            </span>
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Free Plan</span>
              </button>
              
              <button className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Upgrade to Pro</span>
              </button>
              
              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User is not signed in
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignInClick}
        disabled={isLoading}
        className="text-gray-300 border-gray-600 hover:bg-gray-700"
      >
        <User className="h-4 w-4" />
        <span className="hidden md:inline ml-2">Sign In</span>
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="signin"
      />
    </>
  )
}
