import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, UserSquare2, LogOut, PackagePlus } from 'lucide-react';
import { auth } from '../../lib/firebase';

interface SidebarProps {
  role: 'admin' | 'agent';
}

export function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { to: '/admin/agents', icon: Users, label: 'Agent Management' },
    { to: '/admin/leads/new', icon: PackagePlus, label: 'Create Lead' },
  ];

  const agentLinks = [
    { to: '/agent', icon: UserSquare2, label: 'My Leads' },
  ];

  const links = role === 'admin' ? adminLinks : agentLinks;

  return (
    <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 h-screen">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black text-xl">
          L
        </div>
        <span className="text-white font-bold text-xl tracking-tight">
          LeadFlow <span className="text-blue-400 font-normal text-xs uppercase ml-1">Pro</span>
        </span>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-sm rounded-lg transition-colors
              ${isActive 
                ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'}
            `}
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800">
        <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-slate-800 hover:text-red-300 transition-colors">
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
