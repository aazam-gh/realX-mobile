import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBkTKWjHDo4DtBP5qo2-Lc6Kpd9fQ-Akw4",
  authDomain: "reelx-backend.firebaseapp.com",
  projectId: "reelx-backend",
  storageBucket: "reelx-backend.firebasestorage.app",
  messagingSenderId: "516028101860",
  appId: "1:516028101860:web:b0b08939452dcb1ff6e8f1",
  measurementId: "G-YKTVDXPSGG"
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app);
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
