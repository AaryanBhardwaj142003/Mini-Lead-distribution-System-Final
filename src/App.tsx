/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { LoginPage } from './pages/Login/LoginPage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ManageAgents } from './pages/Admin/ManageAgents';
import { AgentDashboard } from './pages/Agent/AgentDashboard';
import { CreateLead } from './pages/Admin/CreateLead';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/agents" element={<ProtectedRoute><ManageAgents /></ProtectedRoute>} />
        <Route path="/admin/leads/new" element={<ProtectedRoute><CreateLead /></ProtectedRoute>} />
        
        {/* Agent Routes */}
        <Route path="/agent" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
        
        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

