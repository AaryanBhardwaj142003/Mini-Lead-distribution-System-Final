import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { LeadTable } from '../../components/Leads/LeadTable';
import { Lead } from '../../types';
import { Search, Filter, Plus } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      if (user) {
        // Real-time listener for Agents
        const unsubAgents = onSnapshot(collection(db, 'users'), snap => {
          const loadedAgents: {id: string, name: string}[] = [];
          snap.forEach(d => {
            const data = d.data();
            if (data.role === 'agent' || data.role === 'admin') {
               loadedAgents.push({id: d.id, name: data.name || data.email || 'Unknown Agent'});
            }
          });
          setAgents(loadedAgents);
        }, (err) => {
          console.error(err);
          setErrorMsg('Failed to load agents mapping: ' + err.message);
        });

        // Real-time listener for Leads
        const leadsQuery = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
        const unsubLeads = onSnapshot(leadsQuery, snap => {
          setLeads(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Lead));
          setLoading(false);
          setErrorMsg('');
        }, (err) => {
          console.error(err);
          setErrorMsg('Failed to load leads: ' + err.message);
          setLoading(false);
        });

        return () => {
          unsubAgents();
          unsubLeads();
        };
      } else {
        setLeads([]);
        setAgents([]);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const filteredLeads = leads.filter(lead => 
    lead.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex bg-slate-50 font-sans text-slate-900 w-full min-h-screen">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="flex items-center space-x-6">
            <h1 className="text-lg font-bold text-slate-800">Admin Dashboard</h1>
            <div className="flex items-center bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span> ROUND ROBIN ACTIVE
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="relative flex items-center">
              <Search className="absolute left-3 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-100 border-none rounded-full pl-9 pr-4 py-2 text-sm w-72 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <button onClick={() => window.location.href = '/admin/leads/new'} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 flex items-center">
              <Plus className="h-4 w-4 mr-1" />
              Manual Lead Entry
            </button>
          </div>
        </header>

        <section className="p-8 flex-1 overflow-y-auto flex flex-col space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg font-medium text-sm">
              {errorMsg}
            </div>
          )}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
               <p className="font-medium">Loading details...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <StatCard title="Total Leads" value={leads.length} />
                 <StatCard title="New Leads" value={leads.filter(l => l.status === 'New').length} />
                 <StatCard title="Contacted" value={leads.filter(l => l.status === 'Contacted').length} />
                 <StatCard title="Closed Won" value={leads.filter(l => l.status === 'Closed').length} />
              </div>

              <LeadTable 
                leads={filteredLeads} 
                isAdmin 
                agents={agents}
                onAgentChange={async (leadId, agentId) => {
                  try {
                     await updateDoc(doc(db, 'leads', leadId), { assignedAgentId: agentId || null });
                  } catch (e: any) {
                     alert("Failed to assign agent: " + e.message);
                  }
                }}
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}
