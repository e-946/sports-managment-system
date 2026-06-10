/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { Login } from './pages/Login';
import { PublicMatches } from './pages/PublicMatches';
import { PublicRanking } from './pages/PublicRanking';
import { AdminDashboard } from './pages/admin/Dashboard';
import { Delegacoes } from './pages/admin/Delegacoes';
import { Esportes } from './pages/admin/Esportes';
import { Participantes } from './pages/admin/Participantes';
import { Equipes } from './pages/admin/Equipes';
import { Partidas } from './pages/admin/Partidas';
import { Usuarios } from './pages/admin/Usuarios';
import { Logs } from './pages/admin/Logs';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 flex justify-center text-gray-500">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Area */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Navigate to="/partidas" replace />} />
            <Route path="/partidas" element={<PublicMatches />} />
            <Route path="/ranking" element={<PublicRanking />} />
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Admin Area */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            
            {/* Somente Admin Geral */}
            <Route path="logs" element={<ProtectedRoute allowedRoles={['ADMIN_GERAL']}><Logs /></ProtectedRoute>} />
            <Route path="usuarios" element={<ProtectedRoute allowedRoles={['ADMIN_GERAL', 'MANAGER']}><Usuarios /></ProtectedRoute>} />
            <Route path="partidas" element={<ProtectedRoute allowedRoles={['ADMIN_GERAL', 'MANAGER']}><Partidas /></ProtectedRoute>} />
            
            {/* Admin Geral e Managers */}
            <Route path="delegacoes" element={<ProtectedRoute allowedRoles={['ADMIN_GERAL', 'MANAGER']}><Delegacoes /></ProtectedRoute>} />
            <Route path="esportes" element={<ProtectedRoute allowedRoles={['ADMIN_GERAL', 'MANAGER']}><Esportes /></ProtectedRoute>} />
            
            {/* Admin Geral, Manager, e Moderador */}
            <Route path="participantes" element={<Participantes />} />
            <Route path="equipes" element={<Equipes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
