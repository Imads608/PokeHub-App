import firebase from 'firebase/app';
import "firebase/auth";
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NX_APP_FIREBASE_API_KEY,
    authDomain: process.env.NX_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NX_APP_FIREBASE_DB_URL,
    projectId: process.env.NX_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NX_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NX_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NX_APP_FIREBASE_APP_ID,
    measurementId: process.env.NX_APP_FIREBASE_MEASUREMENT_ID
};

export const provider = new firebase.auth.GoogleAuthProvider();

const firebaseApp = firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
export const db = firebaseApp.firestore();

export const signInWithGoogle = () => {
    auth.signInWithPopup(provider);
}