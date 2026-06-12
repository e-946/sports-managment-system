import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from './PublicLayout';
import { Dumbbell, Users, Flag, Trophy, LayoutDashboard, LogOut, UsersRound, KeyRound, X } from 'lucide-react';
import { useState } from 'react';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }
    setPasswordError('');
    try {
      const res = await fetch('/api/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        setShowPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        alert('Senha atualizada com sucesso!');
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'Erro ao atualizar senha');
      }
    } catch (err) {
      setPasswordError('Erro de conexão ao atualizar senha');
    }
  };

  const links = [
    { name: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    ...(user?.role === 'ADMIN_GERAL' ? [
      { name: 'Usuários', to: '/admin/usuarios', icon: Users },
    ] : []),
    ...(['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '') ? [
      { name: 'Delegações', to: '/admin/delegacoes', icon: Flag },
      { name: 'Esportes', to: '/admin/esportes', icon: Dumbbell },
    ] : []),
    { name: 'Participantes', to: '/admin/participantes', icon: Users },
    { name: 'Equipes', to: '/admin/equipes', icon: UsersRound },
    ...(['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '') ? [
      { name: 'Partidas', to: '/admin/partidas', icon: Trophy },
    ] : []),
    ...(user?.role === 'ADMIN_GERAL' ? [
      { name: 'Logs do Sistema', to: '/admin/logs', icon: KeyRound },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 flex gap-6 font-sans">
      <aside className="w-64 bg-slate-900 rounded-3xl p-6 text-white shrink-0 hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Gestão</span>
        </div>

        <nav className="space-y-3 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const matches = location.pathname === link.to || (link.to !== '/admin' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors text-sm",
                  matches
                    ? "bg-white/10 border border-white/10 text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", matches ? "bg-emerald-400" : "bg-slate-600")}></div>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <div className="p-4 bg-indigo-600 rounded-2xl text-center text-xs font-medium relative overflow-hidden">
            <div className="relative z-10">
              <div className="truncate mb-2 text-indigo-100 font-bold">
                Olá, {user?.nome?.split(' ')[0]} <br />
                <span className="font-normal opacity-75">({user?.role === 'ADMIN_GERAL' ? 'Admin Geral' : user?.role === 'MANAGER' ? 'Gerente' : 'Moderador'})</span>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full inline-flex items-center justify-center rounded-lg text-sm font-bold transition-colors focus-visible:outline-none h-8 px-3 hover:bg-indigo-700 bg-indigo-800 text-indigo-50 gap-2 shadow-inner border border-indigo-500/20 mb-2"
              >
                <KeyRound className="w-3 h-3" />
                Trocar Senha
              </button>
              <button
                onClick={logout}
                className="w-full inline-flex items-center justify-center rounded-lg text-sm font-bold transition-colors focus-visible:outline-none h-8 px-3 hover:bg-indigo-700 bg-indigo-800 text-indigo-50 gap-2 shadow-inner border border-indigo-500/20"
              >
                <LogOut className="w-3 h-3" />
                Sair
              </button>
            </div>
            {/* Background flourish */}
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-indigo-500 rounded-full blur-xl opacity-50"></div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-6 min-w-0">
        <header className="flex items-center justify-between md:hidden bg-slate-900 text-white p-4 rounded-3xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Gestão</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPasswordModal(true)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <KeyRound className="w-5 h-5 text-indigo-100" />
            </button>
            <button onClick={logout} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
              <LogOut className="w-5 h-5 text-indigo-100" />
            </button>
          </div>
        </header>

        <Outlet />

        <footer className="mt-auto text-center text-sm font-medium text-slate-400 pb-4">
          Sistema de Gestão Esportiva &copy; feito pela <a className="cursor-pointer text-indigo-600 hover:text-indigo-500" target="_blank" href="https://www.instagram.com/e946consultoria/">e-946</a> {new Date().getFullYear()}
        </footer>
      </main>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Trocar Senha</h2>
              </div>

              {passwordError && (
                <div className="p-3 mb-6 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Senha Atual</label>
                  <input type="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nova Senha</label>
                  <input type="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
                  <input type="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200">
                    Atualizar Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
