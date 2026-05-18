import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function checkUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log("Found users:", snap.docs.length);
    snap.docs.forEach(doc => console.log(doc.id, doc.data()));
  } catch(e) {
    console.error("Error reading users:", e);
  }
}
checkUsers();
