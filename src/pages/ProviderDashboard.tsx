import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TOTAL_PROVIDERS, MAX_QUOTA } from '../lib/allocation';

export default function ProviderDashboard() {
  const [selectedProvider, setSelectedProvider] = useState<string>('p1');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [leads, setLeads] = useState<any[]>([]);

  // 1. Listen for Real-Time assigned leads
  useEffect(() => {
    const leadsRef = collection(db, 'leads');
    const q = query(leadsRef, where('assignedProviders', 'array-contains', selectedProvider), orderBy('createdAt', 'desc'));
    
    const unsub = onSnapshot(q, (snap) => {
      setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [selectedProvider]);

  // 2. Listen for Real-Time Provider Quota updates
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'providers', selectedProvider), (doc) => {
      if (doc.exists()) {
        setQuotaUsed(doc.data().quotaUsed || 0);
      } else {
        setQuotaUsed(0);
      }
    });
    return () => unsub();
  }, [selectedProvider]);

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Provider Dashboard</h2>
        <div className="flex gap-4 items-center">
          <label className="text-sm font-semibold text-gray-600">Simulate Identity:</label>
          <select 
            value={selectedProvider} 
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="border p-2 rounded font-medium bg-white shadow-sm outline-none ring-1 ring-gray-200"
          >
            {TOTAL_PROVIDERS.map(p => (
              <option key={p} value={p}>Provider {p.replace('p', '')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-gray-500 font-medium text-sm">Monthly Quota Remaining</span>
          <span className={`text-4xl mt-2 font-bold ${quotaUsed >= MAX_QUOTA ? 'text-red-500' : 'text-blue-600'}`}>
            {MAX_QUOTA - quotaUsed} <span className="text-lg text-gray-400">/ {MAX_QUOTA}</span>
          </span>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-gray-500 font-medium text-sm">Total Leads Received</span>
          <span className="text-4xl mt-2 font-bold text-green-600">{leads.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">Real-Time Lead Inbox</h3>
        </div>
        <ul className="divide-y divide-gray-100">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No leads assigned yet.</div>
          ) : leads.map(lead => (
            <li key={lead.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-lg font-bold text-gray-800 mr-3">{lead.name}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded inline-block font-medium">{lead.serviceType}</span>
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleString() : 'Just now'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{lead.description}</div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center text-sm text-gray-500 font-medium gap-1">
                 📱 {lead.phone}
                </div>
                <div className="flex items-center text-sm text-gray-500 font-medium gap-1">
                 📍 {lead.city}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
