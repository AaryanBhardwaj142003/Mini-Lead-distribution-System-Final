/**
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import PublicForm from './pages/PublicForm';
import ProviderDashboard from './pages/ProviderDashboard';
import TestTools from './pages/TestTools';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <nav className="bg-white border-b shadow-sm relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex gap-8 items-center">
                <span className="font-extrabold text-blue-600 text-xl tracking-tight">Prowider Mini</span>
                <div className="flex gap-6">
                  <Link to="/request-service" className="text-gray-600 hover:text-blue-600 font-medium">1. Submit Lead Form</Link>
                  <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">2. Provider Dashboard</Link>
                  <Link to="/test-tools" className="text-gray-600 hover:text-blue-600 font-medium text-purple-600 font-bold">3. Testing Panel</Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
           <Routes>
             <Route path="/request-service" element={<PublicForm />} />
             <Route path="/dashboard" element={<ProviderDashboard />} />
             <Route path="/test-tools" element={<TestTools />} />
             
             {/* Default redirect map to the assignments starting point */}
             <Route path="*" element={<Navigate to="/test-tools" replace />} />
           </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
