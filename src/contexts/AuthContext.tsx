import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isDemoMode } from '../config/firebase';
import { dataService, UserProfile } from '../config/dataService';

export type UserRole = 'super_admin' | 'admin' | 'user';
export type { UserProfile };

interface AuthContextType {
  currentUser: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  useEffect(() => {
    dataService.init();

    if (isDemoMode) {
      const savedUser = dataService.demoGetCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
        setUserProfile(savedUser);
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    if (isDemoMode) {
      const user = dataService.demoLogin(email, password);
      if (!user) {
        throw { code: 'auth/invalid-credential' };
      }
      setCurrentUser(user);
      setUserProfile(user);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  }

  async function logout() {
    if (isDemoMode) {
      dataService.demoLogout();
    } else {
      await signOut(auth);
    }
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function register(email: string, password: string, displayName: string, role: UserRole) {
    if (isDemoMode) {
      const newUser = dataService.demoRegister(email, displayName, role);
      setCurrentUser(newUser);
      setUserProfile(newUser);
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const profile: UserProfile = {
        uid: userCredential.user.uid,
        email,
        displayName,
        role,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), profile);
      setCurrentUser(profile);
      setUserProfile(profile);
    }
  }

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    register,
    isSuperAdmin,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
