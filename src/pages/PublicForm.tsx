import { useState } from 'react';
import { submitLead } from '../lib/allocation';

export default function PublicForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    serviceType: 'Service 1',
    description: ''
  });
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ loading: true, message: '', type: '' });
    try {
      if (formData.phone.length < 10) throw new Error("Phone number must be at least 10 digits");
      const assigned = await submitLead(formData);
      setStatus({ 
        loading: false, 
        message: `Success! Lead successfully assigned to: ${assigned.join(', ')}`, 
        type: 'success' 
      });
      setFormData(prev => ({ ...prev, description: '', phone: '' })); // Reset sensitive/long parts
    } catch (e: any) {
      setStatus({ loading: false, message: e.message || 'An error occurred', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Request a Service</h2>
        
        {status.message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 border-t pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input required type="tel" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9999999999" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input required type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="New York" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value})}>
                <option value="Service 1">Service 1</option>
                <option value="Service 2">Service 2</option>
                <option value="Service 3">Service 3</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required rows={4} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="How can we help?" />
          </div>
          <button disabled={status.loading} type="submit" className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {status.loading ? 'Submitting...' : 'Submit Lead'}
          </button>
        </form>
      </div>
    </div>
  );
}
