import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  async function fetchUserProfile(user: User) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        // Créer un profil par défaut si inexistant
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Utilisateur',
          role: 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
    setUserProfile(null);
  }

  async function register(email: string, password: string, displayName: string, role: UserRole) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const profile: UserProfile = {
      uid: userCredential.user.uid,
      email,
      displayName,
      role,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', userCredential.user.uid), profile);
    setUserProfile(profile);
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
