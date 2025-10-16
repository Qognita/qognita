'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Calendar,
  Activity,
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Settings,
} from 'lucide-react';
import { logOut } from '@/lib/firebase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AnalysisHistory {
  id: string;
  address: string;
  type: 'wallet' | 'token' | 'program' | 'transaction';
  timestamp: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trustScore?: number;
}

export default function UserDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    tokensAnalyzed: 0,
    walletsAnalyzed: 0,
    threatsDetected: 0,
    memberSince: null as Date | null,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (user) {
      // Load user's analysis history from localStorage for now
      // In production, this would come from Firestore
      loadAnalysisHistory();
      calculateStats();
    }
  }, [user, isAuthenticated, loading, router]);

  const loadAnalysisHistory = () => {
    try {
      const history = localStorage.getItem('qognita_analysis_history');
      if (history) {
        const parsedHistory = JSON.parse(history);
        setAnalysisHistory(parsedHistory.slice(0, 10)); // Show last 10
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }
  };

  const calculateStats = () => {
    try {
      const history = localStorage.getItem('qognita_analysis_history');
      if (history) {
        const parsedHistory = JSON.parse(history);

        const tokensCount = parsedHistory.filter(
          (item: AnalysisHistory) => item.type === 'token'
        ).length;
        const walletsCount = parsedHistory.filter(
          (item: AnalysisHistory) => item.type === 'wallet'
        ).length;
        const threatsCount = parsedHistory.filter(
          (item: AnalysisHistory) => item.riskLevel === 'high' || item.riskLevel === 'critical'
        ).length;

        setStats({
          totalAnalyses: parsedHistory.length,
          tokensAnalyzed: tokensCount,
          walletsAnalyzed: walletsCount,
          threatsDetected: threatsCount,
          memberSince: user?.metadata?.creationTime
            ? new Date(user.metadata.creationTime)
            : new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await logOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      toast.success('Signed out successfully');
      router.push('/');
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wallet':
        return <User className="h-4 w-4" />;
      case 'token':
        return <TrendingUp className="h-4 w-4" />;
      case 'program':
        return <Shield className="h-4 w-4" />;
      case 'transaction':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.displayName || user?.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
            >
              New Analysis
            </Button>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Analyses</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalAnalyses}</div>
              <p className="text-xs text-gray-400">All-time security checks</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Tokens Analyzed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.tokensAnalyzed}</div>
              <p className="text-xs text-gray-400">Token security checks</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Wallets Analyzed</CardTitle>
              <User className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.walletsAnalyzed}</div>
              <p className="text-xs text-gray-400">Wallet security checks</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Threats Detected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.threatsDetected}</div>
              <p className="text-xs text-gray-400">High-risk findings</p>
            </CardContent>
          </Card>
        </div>

        {/* User Info & Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* User Profile */}
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <User className="h-5 w-5 text-blue-400" />
                <span>Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="h-12 w-12 rounded-full" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">{user?.displayName || 'User'}</p>
                  <p className="text-sm text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Member Since</p>
                  <p className="text-white">
                    {stats.memberSince?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Plan</p>
                  <Badge className="bg-blue-600 text-white">Free</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Analysis History */}
          <Card className="border-slate-700 bg-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Clock className="h-5 w-5 text-green-400" />
                <span>Recent Analysis</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your latest security checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisHistory.length > 0 ? (
                <div className="space-y-3">
                  {analysisHistory.map((analysis, index) => (
                    <div
                      key={analysis.id || index}
                      className="flex items-center justify-between rounded-lg bg-slate-700 p-3"
                    >
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(analysis.type)}
                        <div>
                          <p className="text-sm font-medium text-white">
                            {analysis.address.slice(0, 8)}...{analysis.address.slice(-8)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(analysis.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskBadgeColor(analysis.riskLevel)}>
                          {analysis.riskLevel}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-400">
                          {analysis.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Activity className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <p className="text-gray-400">No analysis history yet</p>
                  <p className="text-sm text-gray-500">
                    Start analyzing addresses to see your history
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
