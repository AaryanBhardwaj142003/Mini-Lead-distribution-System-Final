import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';

export async function assignLeadToAgent(leadId: string) {
  const usersRef = db.collection('users');
  const leadsRef = db.collection('leads');

  // 1. Get all agents
  const agentsSnapshot = await usersRef.where('role', '==', 'agent').get();
  
  if (agentsSnapshot.empty) {
    throw new Error('No agents available for distribution');
  }

  // 2. Find the agent who was assigned a lead longest ago
  // We sort by lastAssigned (null or old timestamps first)
  let selectedAgent: any = null;
  let oldestTimestamp = Infinity;

  const agents = agentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
  // Sort by lastAssigned. If null, treat as really old.
  agents.sort((a, b) => {
    const timeA = a.lastAssigned ? a.lastAssigned.toMillis() : 0;
    const timeB = b.lastAssigned ? b.lastAssigned.toMillis() : 0;
    return timeA - timeB;
  });

  selectedAgent = agents[0];

  // 3. Assign the lead
  await leadsRef.doc(leadId).update({
    assignedAgentId: selectedAgent.id,
    status: 'New'
  });

  // 4. Update the agent's lastAssigned timestamp
  await usersRef.doc(selectedAgent.id).update({
    lastAssigned: FieldValue.serverTimestamp()
  });

  return selectedAgent;
}
