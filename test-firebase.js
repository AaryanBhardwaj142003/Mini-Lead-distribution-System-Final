import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, setDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirebase() {
  try {
    console.log("Signing in as admin...");
    const cred = await signInWithEmailAndPassword(auth, 'admin@demo.com', 'password123');
    console.log("Signed in UID:", cred.user.uid);
    
    console.log("Querying users...");
    const users = await getDocs(collection(db, 'users'));
    console.log("Users count:", users.docs.length);

    console.log("Querying leads with orderBy...");
    const leads1 = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc')));
    console.log("Leads (all) count:", leads1.docs.length);

    console.log("Querying leads where assignedAgentId...");
    const leads2 = await getDocs(query(collection(db, 'leads'), where('assignedAgentId', '==', cred.user.uid)));
    console.log("Leads (assigned) count:", leads2.docs.length);

  } catch(e) {
    if (e.code === 'permission-denied' || e.message.includes('Missing or insufficient permissions')) {
       console.error("PERMISSION ERROR:", e.message);
    } else {
       console.error("ERROR:", e);
    }
  }
}

testFirebase().catch(console.error);
