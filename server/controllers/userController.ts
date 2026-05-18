import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { db, auth } from '../firebase.js';

export const addAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // 1. Create in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Set custom claims or add to Firestore users collection
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      role: 'agent',
      lastAssigned: null
    });

    res.status(201).json({ uid: userRecord.uid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAgents = async (req: AuthRequest, res: Response) => {
  try {
    const agentsSnapshot = await db.collection('users').where('role', '==', 'agent').get();
    const agents = agentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await auth.deleteUser(id);
    await db.collection('users').doc(id).delete();

    res.json({ message: 'Agent removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
