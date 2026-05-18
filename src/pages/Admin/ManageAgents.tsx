import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Layout/Sidebar';
import { User } from '../../types';
import { Plus, Trash2, Mail, Calendar, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function ManageAgents() {
  const [agents, setAgents] = useState<User[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      if (user) {
        const unsub = onSnapshot(collection(db, 'users'), snap => {
          const allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
          setAgents(allUsers.map(u => ({ ...u, name: u.name || u.email?.split('@')[0] || 'Unknown User' })));
          setLoading(false);
          setErrorMsg('');
        }, (err) => {
          console.error(err);
          setErrorMsg('Failed to load agents: ' + err.message);
          setLoading(false);
        });
        return () => unsub();
      } else {
        setAgents([]);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  const handleMakeAdmin = async (id: string) => {
    await updateDoc(doc(db, 'users', id), { role: 'admin' });
  };

  const handleRemoveAgent = async (id: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', id));
    } catch (e: any) {
      alert('Deletion error: ' + e.message);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentEmail) return;
    
    try {
      // Initialize a secondary app to create users without logging out the admin
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const config = (await import('../../../firebase-applet-config.json')).default;
      
      const existingApp = getApps().find(a => a.name === 'SecondaryAppForCreation');
      const secondaryApp = existingApp ? existingApp : initializeApp(config, 'SecondaryAppForCreation');
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newAgentEmail, 'password123');
      await signOut(secondaryAuth); // Sign out of the secondary immediately

      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newAgentName,
        email: newAgentEmail,
        role: 'agent',
        lastAssigned: null
      });

      setNewAgentName('');
      setNewAgentEmail('');
      setIsAddModalOpen(false);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        alert('This email is already registered. If they are not in the dashboard, they may need to login once to initialize their profile, or you can delete their Auth account in Firebase Console.');
      } else {
        alert('Error creating agent: ' + e.message);
      }
    }
  };

  return (
    <div className="flex bg-slate-50 font-sans text-slate-900 w-full min-h-screen">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">Agent Management</h1>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New Agent
          </button>
        </header>

        <section className="p-8 flex-1 overflow-y-auto flex flex-col">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg font-medium text-sm mb-6">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[50vh]">
               <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
               <p className="font-medium">Loading agents...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <motion.div 
                  key={agent.id}
                  whileHover={{ y: -2 }}
                  className={`bg-white p-5 rounded-xl border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow ${agent.role === 'admin' ? 'border-indigo-300' : 'border-slate-200'}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold ${agent.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                      {agent.name.split(' ').map(n => n.charAt(0)).join('')}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                         <span className="font-bold text-slate-700">{agent.name}</span>
                         {agent.role === 'admin' && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                      </div>
                      <div className="flex items-center text-xs text-slate-400 mt-0.5">
                        <Mail className="h-3 w-3 mr-1" />
                        {agent.email}
                      </div>
                      <div className="flex items-center text-xs text-slate-400 mt-0.5 font-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        {agent.lastAssigned ? `Active today` : 'Never active'}
                      </div>
                    </div>
                  </div>
                  <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-lg">
                     {agent.role === 'agent' && (
                       <button 
                         onClick={() => handleMakeAdmin(agent.id)}
                         title="Promote to Admin"
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                       >
                         <ShieldCheck className="h-4 w-4" />
                       </button>
                     )}
                    <button 
                      onClick={() => handleRemoveAgent(agent.id)}
                      title="Remove Agent"
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
              {agents.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-white shadow-sm">
                  <ShieldAlert className="h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">No agents found</h3>
                  <p className="text-slate-500 mt-2 text-sm max-w-sm">No agents exist in the database or none matched the filter. Add a new agent to get started.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Add Agent Modal */}
        <AnimatePresence>
          {isAddModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Add New Agent</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
                </div>
                <form onSubmit={handleAddAgent} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={newAgentName}
                      onChange={e => setNewAgentName(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={newAgentEmail}
                      onChange={e => setNewAgentEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      placeholder="jane@distro.com"
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button type="submit" className="bg-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-lg shadow-md shadow-blue-600/20 hover:bg-blue-700 transition">
                      Add Agent
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
