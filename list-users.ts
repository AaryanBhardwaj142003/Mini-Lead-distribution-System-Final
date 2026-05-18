import { db } from './server/firebase.js';

async function listUsers() {
  const users = await db.collection('users').get();
  console.log("Users:", users.docs.map(d => d.data()));
}

listUsers().catch(console.error);
