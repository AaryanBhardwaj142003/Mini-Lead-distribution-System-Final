import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { LeadTable } from '../../components/Leads/LeadTable';
import { Lead, LeadStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';

export function AgentDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [agentName, setAgentName] = useState('Agent');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      if (user) {
        setAgentName(user.email?.split('@')[0] || 'Agent');
        const q = query(collection(db, 'leads'), where('assignedAgentId', '==', user.uid));
        const unsubLeads = onSnapshot(q, snap => {
          const docs = snap.docs.map(d => ({id: d.id, ...d.data()}) as Lead);
          docs.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          setLeads(docs);
          setLoading(false);
        }, (err) => {
          console.error(err);
          setErrorMsg('Failed to load leads: ' + err.message);
          setLoading(false);
        });
        return () => unsubLeads();
      } else {
        setLeads([]);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await updateDoc(doc(db, 'leads', id), { status });
      setNotification({ message: `Lead updated to ${status} via real-time sync!`, type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      setNotification({ message: e.message, type: 'info' });
    }
  };

  return (
    <div className="flex bg-slate-50 font-sans text-slate-900 w-full min-h-screen">
      <Sidebar role="agent" />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex items-center space-x-6">
            <h1 className="text-lg font-bold text-slate-800">Agent {agentName}'s Dashboard</h1>
            <div className="flex items-center bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span> ONLINE
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-xs font-bold text-slate-300">
              {agentName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <section className="p-8 flex-1 overflow-y-auto flex flex-col space-y-6">
          <AnimatePresence>
            {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-lg flex items-center shadow-sm ${
                  notification.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                <CheckCircle2 className="h-5 w-5 mr-3" />
                <span className="text-sm font-semibold">{notification.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg font-medium text-sm">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
               <p className="font-medium">Loading your leads...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Leads</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{leads.filter(l => l.status !== 'Closed').length}</p>
                </div>
              </div>

              <LeadTable 
                leads={leads} 
                onStatusChange={handleStatusChange}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
