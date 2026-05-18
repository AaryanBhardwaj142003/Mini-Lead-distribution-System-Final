import { Response } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthRequest } from '../middleware/auth.js';
import { assignLeadToAgent } from '../services/leadService.js';
import { db } from '../firebase.js';

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const { clientName, contactInfo } = req.body;
    
    const leadRef = await db.collection('leads').add({
      clientName,
      contactInfo,
      status: 'New',
      createdAt: FieldValue.serverTimestamp(),
      assignedAgentId: null
    });

    // Automatically distribute
    const assignedAgent = await assignLeadToAgent(leadRef.id);

    res.status(201).json({ id: leadRef.id, assignedAgent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllLeads = async (req: AuthRequest, res: Response) => {
  try {
    const leadsSnapshot = await db.collection('leads').orderBy('createdAt', 'desc').get();
    const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(leads);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateLeadStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if agent owns the lead (unless admin)
    const leadDoc = await db.collection('leads').doc(id).get();
    if (!leadDoc.exists) return res.status(404).json({ message: 'Lead not found' });
    
    const leadData = leadDoc.data();
    // In a real app, check req.user.uid == leadData.assignedAgentId

    await db.collection('leads').doc(id).update({ status });
    res.json({ message: 'Status updated' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
