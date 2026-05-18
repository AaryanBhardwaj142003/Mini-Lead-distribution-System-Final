import { db } from './firebase';
import { doc, runTransaction, serverTimestamp, getDoc } from 'firebase/firestore';

export const POOLS = {
  'Service 1': ['p2', 'p3', 'p4'],
  'Service 2': ['p6', 'p7', 'p8'],
  'Service 3': ['p2', 'p3', 'p5', 'p6', 'p7', 'p8'],
};

export const MANDATORY = {
  'Service 1': ['p1'],
  'Service 2': ['p5'],
  'Service 3': ['p1', 'p4'],
};

export const MAX_QUOTA = 10;
export const TOTAL_PROVIDERS = [1, 2, 3, 4, 5, 6, 7, 8].map(i => `p${i}`);

export async function submitLead(leadData: { name: string; phone: string; city: string; serviceType: string; description: string }) {
  const sanitizedPhone = leadData.phone.replace(/\D/g, '');
  const sanitizedService = leadData.serviceType.replace(/\s+/g, '_');
  const leadId = `${sanitizedPhone}_${sanitizedService}`;

  return await runTransaction(db, async (transaction) => {
    // 1. Check for duplicates (Database Level Rule enforced via generic transaction read lock)
    const leadRef = doc(db, 'leads', leadId);
    const leadSnap = await transaction.get(leadRef);

    if (leadSnap.exists()) {
      throw new Error('Duplicate Lead: A lead with this phone number already exists for this service.');
    }

    // 2. Fetch current allocation round-robin state
    const stateRef = doc(db, 'system', 'allocation_state');
    const stateSnap = await transaction.get(stateRef);
    const state = stateSnap.exists() ? stateSnap.data() : {};

    // 3. Fetch all potential provider quotas (Mandatory + Pool)
    const mandatoryForService = MANDATORY[leadData.serviceType as keyof typeof MANDATORY] || [];
    const poolForService = POOLS[leadData.serviceType as keyof typeof POOLS] || [];
    const potentialProviders = [...new Set([...mandatoryForService, ...poolForService])];
    
    const quotas: Record<string, number> = {};
    const providerSnaps = await Promise.all(potentialProviders.map(p => transaction.get(doc(db, 'providers', p))));
    providerSnaps.forEach(snap => {
      quotas[snap.id] = snap.exists() ? (snap.data().quotaUsed || 0) : 0;
    });

    const selectedProviders: string[] = [];

    // 4. Assign Mandatory Providers
    for (const p of mandatoryForService) {
      if (quotas[p] < MAX_QUOTA) {
        selectedProviders.push(p);
      }
    }

    // 5. Fair Distribution (Round-Robin) for remaining slots
    let remainingSlots = 3 - selectedProviders.length;
    let lastIndex = state[leadData.serviceType] ?? -1;
    let currentPoolIndex = lastIndex;
    let checkedCount = 0;

    while (remainingSlots > 0 && checkedCount < poolForService.length) {
      currentPoolIndex = (currentPoolIndex + 1) % poolForService.length;
      const candidate = poolForService[currentPoolIndex];

      if (quotas[candidate] < MAX_QUOTA && !selectedProviders.includes(candidate)) {
        selectedProviders.push(candidate);
        remainingSlots--;
        lastIndex = currentPoolIndex;
      }
      checkedCount++;
    }

    // Reject if we couldn't fulfill completely (Optional based on business rules, but assuming we just do our best here)
    // Even if we found less than 3, we proceed. We can enforce exactly 3 if needed.

    // 6. Writes (Atomic within transaction)
    for (const p of selectedProviders) {
      transaction.set(doc(db, 'providers', p), {
        id: p,
        quotaUsed: (quotas[p] || 0) + 1,
      }, { merge: true });
    }

    state[leadData.serviceType] = lastIndex;
    transaction.set(stateRef, state, { merge: true });

    transaction.set(leadRef, {
      ...leadData,
      assignedProviders: selectedProviders,
      createdAt: serverTimestamp(),
      status: 'New'
    });

    return selectedProviders;
  });
}

export async function processWebhook(eventId: string, payload: { action: string }) {
  const webhookRef = doc(db, 'processed_webhooks', eventId);
  
  return await runTransaction(db, async (transaction) => {
    // Idempotency constraint
    const snap = await transaction.get(webhookRef);
    if (snap.exists()) {
      return { status: 'duplicate', message: 'Webhook already processed.' };
    }

    // Process Business Logic
    if (payload.action === 'reset_quota') {
      const providerRefs = TOTAL_PROVIDERS.map(p => doc(db, 'providers', p));
      for (const pRef of providerRefs) {
        transaction.set(pRef, { quotaUsed: 0 }, { merge: true });
      }
    }

    // Mark event processed
    transaction.set(webhookRef, { 
      processedAt: serverTimestamp(), 
      payloadAction: payload.action 
    });
    
    return { status: 'success', message: 'Webhook processed successfully' };
  });
}
