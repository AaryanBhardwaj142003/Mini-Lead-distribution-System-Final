export type UserRole = 'admin' | 'agent';

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  lastAssigned?: any;
}

export type LeadStatus = 'New' | 'Contacted' | 'Closed';

export interface Lead {
  id: string;
  clientName: string;
  contactInfo: string;
  status: LeadStatus;
  assignedAgentId: string | null;
  createdAt: any;
}
