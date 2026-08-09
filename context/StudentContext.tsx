import { getAuth, onAuthStateChanged, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

type StudentData = {
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  creatorCode?: string;
  savings?: number;
  cashback?: number;
  [key: string]: any;
};

type StudentContextValue = {
  studentData: StudentData | null;
  loading: boolean;
  docExists: boolean | null; // null = not yet checked, true = exists, false = doesn't exist
  error: Error | null;
  refreshProfile: () => void;
};

const StudentContext = createContext<StudentContextValue | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [docExists, setDocExists] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const handleAuthState = (observedUser: FirebaseAuthTypes.User | null) => {
      const user = observedUser ?? auth.currentUser;
      // Clean up previous snapshot listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!user) {
        setStudentData(null);
        setDocExists(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      const db = getFirestore();
      const studentDocRef = doc(db, 'students', user.uid);

      unsubscribeRef.current = onSnapshot(
        studentDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setStudentData(docSnap.data() as StudentData);
            setDocExists(true);
          } else {
            setStudentData(null);
            setDocExists(false);
          }
          setLoading(false);
          setError(null);
        },
        (error) => {
          logger.error('StudentContext snapshot error:', error);
          setStudentData(null);
          // A listener failure does not mean the student's profile is missing.
          setDocExists(null);
          setError(error);
          setLoading(false);
        }
      );
    };

    if (auth.currentUser) handleAuthState(auth.currentUser);
    const authSubscriber = onAuthStateChanged(auth, handleAuthState);

    return () => {
      authSubscriber();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [refreshKey]);

  const refreshProfile = useCallback(() => {
    setLoading(true);
    setError(null);
    setRefreshKey((value) => value + 1);
  }, []);

  return (
    <StudentContext.Provider value={{ studentData, loading, docExists, error, refreshProfile }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent(): StudentContextValue {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
