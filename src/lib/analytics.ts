import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';

export interface AnalysisRecord {
  userId?: string;
  address: string;
  addressType: 'wallet' | 'token' | 'program' | 'transaction';
  trustScore?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: any[];
  timestamp: number;
  analysisTime: number; // in milliseconds
}

export const saveAnalysisRecord = async (record: AnalysisRecord, userId?: string) => {
  try {
    // Save to localStorage for immediate access
    const localHistory = JSON.parse(localStorage.getItem('qognita_analysis_history') || '[]');
    const newRecord = {
      id: Date.now().toString(),
      ...record,
      timestamp: Date.now(),
    };

    localHistory.unshift(newRecord);
    // Keep only last 50 records in localStorage
    if (localHistory.length > 50) {
      localHistory.splice(50);
    }

    localStorage.setItem('qognita_analysis_history', JSON.stringify(localHistory));

    // Save to Firestore if user is authenticated
    if (userId) {
      // Add to user's analysis collection
      await addDoc(collection(db, 'users', userId, 'analyses'), {
        ...record,
        createdAt: serverTimestamp(),
      });

      // Update user stats
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        analysisCount: increment(1),
        lastAnalysisAt: serverTimestamp(),
      });

      console.log('✅ Analysis saved to Firestore');
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to save analysis record:', error);
    return { success: false, error };
  }
};

export const getRiskLevel = (
  risks: any[],
  trustScore?: number
): 'low' | 'medium' | 'high' | 'critical' => {
  if (!risks || risks.length === 0) {
    return 'low';
  }

  const criticalRisks = risks.filter((risk) => risk.severity === 'critical');
  const highRisks = risks.filter((risk) => risk.severity === 'high');
  const mediumRisks = risks.filter((risk) => risk.severity === 'medium');

  if (criticalRisks.length > 0) {
    return 'critical';
  }
  if (highRisks.length > 0) {
    return 'high';
  }
  if (mediumRisks.length > 0) {
    return 'medium';
  }

  // Consider trust score if available
  if (trustScore !== undefined) {
    if (trustScore < 30) {
      return 'high';
    }
    if (trustScore < 60) {
      return 'medium';
    }
  }

  return 'low';
};

export const getAnalysisStats = () => {
  try {
    const history = JSON.parse(localStorage.getItem('qognita_analysis_history') || '[]');

    return {
      total: history.length,
      tokens: history.filter((item: any) => item.addressType === 'token').length,
      wallets: history.filter((item: any) => item.addressType === 'wallet').length,
      programs: history.filter((item: any) => item.addressType === 'program').length,
      transactions: history.filter((item: any) => item.addressType === 'transaction').length,
      threats: history.filter(
        (item: any) => item.riskLevel === 'high' || item.riskLevel === 'critical'
      ).length,
      lastWeek: history.filter((item: any) => Date.now() - item.timestamp < 7 * 24 * 60 * 60 * 1000)
        .length,
    };
  } catch (error) {
    console.error('Failed to get analysis stats:', error);
    return {
      total: 0,
      tokens: 0,
      wallets: 0,
      programs: 0,
      transactions: 0,
      threats: 0,
      lastWeek: 0,
    };
  }
};
