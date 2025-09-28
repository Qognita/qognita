'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { RecentAnalysis } from '@/components/history/RecentAnalysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, Activity, Shield, ExternalLink } from 'lucide-react'

interface AnalysisHistory {
  id: string
  address: string
  type: string
  trustScore: number
  timestamp: string
  risks: number
}

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const [analysisCount, setAnalysisCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (loading) return
    
    if (!isAuthenticated) {
      router.push('/dashboard')
      return
    }

    // Load analysis count from localStorage
    try {
      const savedHistory = localStorage.getItem('qognita_analysis_history')
      if (savedHistory) {
        const history = JSON.parse(savedHistory)
        setAnalysisCount(history.length)
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error)
    }
    
    setIsLoading(false)
  }, [user, isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getTrustScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-600'
    if (score >= 70) return 'bg-yellow-600'
    return 'bg-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">My Account</h1>
            <p className="text-gray-300 text-lg">
              Manage your profile and view your analysis history
            </p>
          </div>

          {/* Account Information */}
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-400" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="text-white font-mono">
                      {user?.displayName || 'Not provided'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">
                      {user?.email || 'Not provided'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="text-white">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Analyses</p>
                    <p className="text-white">{analysisCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis History */}
          <RecentAnalysis />
        </div>
      </main>
    </div>
  )
}
