import { useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { TOTAL_PROVIDERS, processWebhook, submitLead } from '../lib/allocation';

export default function TestTools() {
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]);

  const initSystem = async () => {
    log("Initializing seed data for 8 Providers...");
    try {
      for (const p of TOTAL_PROVIDERS) {
        const ref = doc(db, 'providers', p);
        if (!(await getDoc(ref)).exists()) {
           await setDoc(ref, { id: p, quotaUsed: 0 });
        }
      }
      log("Initialization complete!");
    } catch (e: any) {
      log("Error: " + e.message);
    }
  };

  const fireWebhook = async () => {
    const idempotencyKey = prompt("Enter an Idempotency Event Key (e.g., evt_123).\nTyping the same key twice should execute only once.", "evt_" + Math.floor(Math.random()*1000));
    if (!idempotencyKey) return;

    log(`Firing webhook with Event ID: ${idempotencyKey}...`);
    try {
      const res = await processWebhook(idempotencyKey, { action: 'reset_quota' });
      log(`Webhook result: [${res.status}] ${res.message}`);
    } catch (e: any) {
      log("Error: " + e.message);
    }
  };

  const bulkCreateLeads = async () => {
    log("Simulating 10 simultaneous leads creation...");
    const promises = [];
    const rnd = Math.floor(Math.random() * 10000);
    
    for (let i = 0; i < 10; i++) {
      const serviceType = ['Service 1', 'Service 2', 'Service 3'][Math.floor(Math.random() * 3)];
      promises.push(
        submitLead({
          name: `Concurrent Lead ${rnd}_${i}`,
          phone: `55500${rnd}${i}`, // guaranteed unique mostly
          city: 'London',
          serviceType,
          description: `Generated in concurrency test batch #${rnd}`
        })
      );
    }
    
    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter(r => r.status === 'fulfilled').length;
    log(`Concurrency batch finished: ${fulfilled} succeeded, ${10 - fulfilled} failed.`);
  };

  const simulateDuplicateCrash = async () => {
    log("Simulating 3 simultaneous duplicate leads creation (Same Phone, Same Service)...");
    const promises = [];
    
    for (let i = 0; i < 3; i++) {
      promises.push(
        submitLead({
          name: `Duplicate Spammer ${i}`,
          phone: `9999999999`, 
          city: 'Paris',
          serviceType: 'Service 1',
          description: `Spam attempt ${i}`
        })
      );
    }
    
    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter(r => r.status === 'fulfilled').length;
    log(`Duplicates batch finished. Expected: 1 Success, 2 Fails ---> Reality: ${fulfilled} succeeded, ${3 - fulfilled} failed.`);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 flex flex-col md:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Evaluation Test Tools</h2>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold mb-2">1. System Setup</h3>
           <p className="text-sm text-gray-500 mb-4">Run this once to create the background provider documents and init quotas to 0.</p>
           <button onClick={initSystem} className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700">Initialize Seed Data</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold mb-2">2. Webhook Simulation (Idempotency)</h3>
           <p className="text-sm text-gray-500 mb-4">Simulates a payment gateway fulfilling a quota reset. Safe against retries.</p>
           <button onClick={fireWebhook} className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700">Fire Quota Reset Webhook</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <h3 className="text-lg font-bold mb-2">3. Concurrency Safety</h3>
           <p className="text-sm text-gray-500 mb-4">Fires 10 creates simultaneously. Watch fair allocation accurately reflect without overstepping max quotas.</p>
           <div className="flex gap-4">
             <button onClick={bulkCreateLeads} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">Fire Bulk Valid Leads</button>
             <button onClick={simulateDuplicateCrash} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700">Fire Bulk Duplicates</button>
           </div>
        </div>
      </div>

      <div className="flex-1">
         <div className="bg-gray-900 rounded-xl shadow-lg h-full p-4 overflow-hidden flex flex-col font-mono">
            <h3 className="text-gray-400 text-sm font-bold border-b border-gray-800 pb-2 mb-2 uppercase tracking-wider">Console Logic Log</h3>
            <div className="flex-1 overflow-y-auto space-y-1">
              {logs.map((L, i) => (
                <div key={i} className="text-green-400 text-xs">{L}</div>
              ))}
              {logs.length === 0 && <span className="text-gray-600 text-sm italic">Logs pending...</span>}
            </div>
            <button onClick={() => setLogs([])} className="mt-4 border border-gray-700 text-gray-400 px-3 py-1 rounded text-xs hover:bg-gray-800">Clear</button>
         </div>
      </div>
    </div>
  );
}
