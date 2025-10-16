'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { AuthModal } from './AuthModal';
import { toast } from 'sonner';

export function AuthButton() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignInClick = () => {
    setShowAuthModal(true);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await logOut();
      if (error) {
        toast.error('Failed to sign out');
      } else {
        toast.success('Signed out successfully');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
        <span className="text-sm text-gray-300">Loading...</span>
      </div>
    );
  }

  // User is signed in
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center space-x-3">
        {/* User Profile Circle */}
        <div className="group relative">
          <button className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-2 text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-purple-700">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">
              {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
            </span>
          </button>

          {/* Dropdown Menu */}
          <div className="invisible absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-800">
            <div className="py-2">
              <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>

              <button className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Free Plan</span>
              </button>

              <button className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm font-medium text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-700">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Upgrade to Pro</span>
              </button>

              <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                <button
                  onClick={handleSignOut}
                  disabled={isLoading}
                  className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is not signed in
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignInClick}
        disabled={isLoading}
        className="border-gray-600 text-gray-300 hover:bg-gray-700"
      >
        <User className="h-4 w-4" />
        <span className="ml-2 hidden md:inline">Sign In</span>
      </Button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="signin"
      />
    </>
  );
}
