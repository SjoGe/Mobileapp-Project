import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyDTTHwPAstwvQlG6p5BgaoIlCWWZDXEczw",
  authDomain: "sahkoguru-c5a67.firebaseapp.com",
  projectId: "sahkoguru-c5a67",
  storageBucket: "sahkoguru-c5a67.appspot.com",
  messagingSenderId: "690523255667",
  appId: "1:690523255667:android:39127964d1ae7554a64b06"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };