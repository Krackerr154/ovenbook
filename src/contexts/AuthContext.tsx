'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { mockAuthService, mockUsers } from '@/lib/mockData';
import { safeToDate } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isDevelopmentMode = process.env.NEXT_PUBLIC_DEVELOPMENT_MODE === 'true';

  useEffect(() => {
    if (isDevelopmentMode) {
      // Development mode - use mock data
      console.log('🧪 Running in development mode with mock data');
      setLoading(false);
      // Auto-login with demo user for testing
      setTimeout(() => {
        setUser(mockUsers[0]); // Login as John Doe by default
      }, 1000);
      return;
    }

    // Production mode - use Firebase
    console.log('🔥 Running in production mode with Firebase');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: userData.name || userData.displayName || '',
              email: firebaseUser.email!,
              isAdmin: userData.isAdmin || false,
              createdAt: safeToDate(userData.createdAt),
              // Computed properties for backward compatibility
              displayName: userData.name || userData.displayName || '',
              role: userData.isAdmin ? 'admin' : 'user',
            });
            console.log('✅ User loaded from Firebase:', userData.name);
          } else {
            console.log('⚠️ User document not found in Firestore');
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevelopmentMode]);

  const login = async (email: string, password: string) => {
    if (isDevelopmentMode) {
      // Development mode
      const mockUser = await mockAuthService.login(email, password);
      setUser(mockUser);
      return;
    }
    
    // Production mode
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, displayName: string) => {
    if (isDevelopmentMode) {
      // Development mode
      const mockUser = await mockAuthService.register(email, password, displayName);
      setUser(mockUser);
      return;
    }
    
    // Production mode
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore with new structure
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: displayName,
      email: email,
      isAdmin: false, // Default to regular user
      createdAt: new Date(),
    });
  };

  const logout = async () => {
    if (isDevelopmentMode) {
      // Development mode
      await mockAuthService.logout();
      setUser(null);
      return;
    }
    
    // Production mode
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
