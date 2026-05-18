import { Lead, LeadStatus } from '../../types';
import { StatusBadge } from '../UI/StatusBadge';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  isAdmin?: boolean;
  onStatusChange?: (id: string, status: LeadStatus) => void;
  agents?: {id: string, name: string}[];
  onAgentChange?: (id: string, agentId: string) => void;
}

export function LeadTable({ leads, isAdmin, onStatusChange, agents, onAgentChange }: LeadTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <h3 className="font-bold text-slate-800">Assigned Leads</h3>
      </div>
      <div className="overflow-hidden flex-1 overflow-x-auto">
        <table className="w-full text-left table-fixed min-w-max">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              <th className="px-6 py-4 w-1/4">Client Name</th>
              <th className="px-6 py-4 w-1/4">Contact</th>
              <th className="px-6 py-4 w-1/6">Status</th>
              {isAdmin && <th className="px-6 py-4 w-1/4">Assigned Agent</th>}
              <th className="px-6 py-4 w-24 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{lead.clientName}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-xs text-slate-400">{lead.contactInfo}</span>
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={lead.status} />
                </td>
                {isAdmin && (
                  <td className="px-6 py-3.5">
                    {onAgentChange && agents ? (
                      <select
                        className="text-xs border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white p-1"
                        value={lead.assignedAgentId || ''}
                        onChange={(e) => onAgentChange(lead.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-600 font-medium">{lead.assignedAgentId || 'Unassigned'}</span>
                      </div>
                    )}
                  </td>
                )}
                <td className="px-6 py-3.5 text-center">
                  {!onStatusChange ? (
                     <button className="text-slate-400 hover:text-blue-600 font-bold">
                      <MoreHorizontal className="h-5 w-5 mx-auto" />
                    </button>
                  ) : (
                    <select 
                      className="text-xs border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                      value={lead.status}
                      onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500 italic">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
