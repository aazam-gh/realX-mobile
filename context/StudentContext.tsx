import { getAuth, onAuthStateChanged, type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
};

const StudentContext = createContext<StudentContextValue | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [docExists, setDocExists] = useState<boolean | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const authSubscriber = onAuthStateChanged(getAuth(), (user: FirebaseAuthTypes.User | null) => {
      // Clean up previous snapshot listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      if (!user) {
        setStudentData(null);
        setDocExists(null);
        setLoading(false);
        return;
      }

      setLoading(true);
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
        },
        (error) => {
          logger.error('StudentContext snapshot error:', error);
          setStudentData(null);
          setDocExists(false);
          setLoading(false);
        }
      );
    });

    return () => {
      authSubscriber();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return (
    <StudentContext.Provider value={{ studentData, loading, docExists }}>
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
