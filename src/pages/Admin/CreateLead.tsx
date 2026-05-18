import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sidebar } from '../../components/Layout/Sidebar';
import { useNavigate } from 'react-router-dom';
import { PackagePlus } from 'lucide-react';

const createLeadSchema = z.object({
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  contactInfo: z.string().min(5, 'Contact info must be valid'),
});

type CreateLeadFormValues = z.infer<typeof createLeadSchema>;

export function CreateLead() {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
  });

  const onSubmit = async (data: CreateLeadFormValues) => {
    try {
      const { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');
      
      const leadRef = await addDoc(collection(db, 'leads'), {
        clientName: data.clientName,
        contactInfo: data.contactInfo,
        status: 'New',
        createdAt: serverTimestamp(),
        assignedAgentId: null
      });

      // Find agent for round robin
      const usersRef = collection(db, 'users');
      const agentsSnapshot = await getDocs(query(usersRef, where('role', '==', 'agent')));
      
      if (!agentsSnapshot.empty) {
        const agents = agentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        agents.sort((a: any, b: any) => {
          const timeA = a.lastAssigned ? a.lastAssigned.toMillis() : 0;
          const timeB = b.lastAssigned ? b.lastAssigned.toMillis() : 0;
          return timeA - timeB;
        });

        const selectedAgent = agents[0];
        
        await updateDoc(doc(db, 'leads', leadRef.id), {
          assignedAgentId: selectedAgent.id
        });
        
        await updateDoc(doc(db, 'users', selectedAgent.id), {
          lastAssigned: serverTimestamp()
        });
      }

      setSuccess(true);
      reset();
      setTimeout(() => {
        setSuccess(false);
        navigate('/admin');
      }, 2000);
    } catch (e: any) {
      alert('Routing Failed: ' + e.message);
    }
  };

  return (
    <div className="flex bg-slate-50 font-sans text-slate-900 w-full min-h-screen">
      <Sidebar role="admin" />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-slate-800">Add New Lead</h1>
        </header>

        <section className="p-8 flex-1 overflow-y-auto">
          <div className="max-w-lg bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Lead Details</h3>
                <p className="text-xs text-slate-500">Enter the client's information to initiate routing.</p>
              </div>
            </div>

            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-semibold">
                Lead successfully created and routed to an agent!
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Client Name</label>
                <input
                  {...register('clientName')}
                  className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm ${errors.clientName ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="e.g. Acme Corp"
                />
                {errors.clientName && <p className="mt-1 text-xs text-red-500 font-medium">{errors.clientName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Information</label>
                <input
                  {...register('contactInfo')}
                  className={`w-full px-4 py-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm ${errors.contactInfo ? 'border-red-400' : 'border-slate-200'}`}
                  placeholder="e.g. contact@acme.com"
                />
                {errors.contactInfo && <p className="mt-1 text-xs text-red-500 font-medium">{errors.contactInfo.message}</p>}
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Routing...' : 'Create & Route Lead'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
