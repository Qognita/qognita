// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfifFMs44jzEGSjb99JNNfjMOb96FZpOI",
  authDomain: "qognita.firebaseapp.com",
  projectId: "qognita",
  storageBucket: "qognita.firebasestorage.app",
  messagingSenderId: "289912521360",
  appId: "1:289912521360:web:61290036d1298348a58e15",
  measurementId: "G-7MS8MBVLLQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser and not in production)
let analytics;
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  analytics = getAnalytics(app);
}
export { analytics };

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create user document in Firestore
    await createUserDocument(user);
    
    return { user, error: null };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { user: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Create user document in Firestore
    await createUserDocument(user, { displayName });
    
    return { user, error: null };
  } catch (error) {
    console.error('Email sign up error:', error);
    return { user: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    console.error('Email sign in error:', error);
    return { user: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
};

// Create user document in Firestore
const createUserDocument = async (user: User, additionalData?: any) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = serverTimestamp();
    
    try {
      await setDoc(userRef, {
        displayName: additionalData?.displayName || displayName,
        email,
        photoURL,
        createdAt,
        lastLoginAt: serverTimestamp(),
        analysisCount: 0,
        plan: 'free',
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  } else {
    // Update last login time
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};
