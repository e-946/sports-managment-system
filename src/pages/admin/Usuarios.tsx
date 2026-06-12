import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, X } from 'lucide-react';
import { Delegacao } from '../../types';
import { useAuth } from '../../context/AuthContext';

export function formatCPF(value: string): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 4) return value;
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

interface UserRow {
  id: string;
  nome: string;
  cpf: string;
  role: string;
  delegacaoNome: string;
}

export function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UserRow[]>([]);
  const [delegacoes, setDelegacoes] = useState<Delegacao[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    password: '',
    role: user?.role === 'MANAGER' ? 'MODERADOR' : 'MANAGER',
    delegacaoId: ''
  });

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    nome: '',
    role: 'MODERADOR',
    delegacaoId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const loadData = () => {
    fetch('/api/usuarios').then(r => r.json()).then(data => setUsuarios(Array.isArray(data) ? data : []));
    fetch('/api/delegacoes').then(r => r.json()).then(data => setDelegacoes(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        loadData();
        setFormData({ nome: '', cpf: '', password: '', role: user?.role === 'MANAGER' ? 'MODERADOR' : 'MANAGER', delegacaoId: '' });
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao cadastrar usuário');
      }
    } catch(err) {
      setError('Erro de conexão ao cadastrar usuário');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    try {
      const payload: any = {
        nome: editFormData.nome,
        role: editFormData.role,
        delegacaoId: editFormData.role === 'MODERADOR' ? editFormData.delegacaoId : ''
      };
      if (editFormData.password) {
        payload.password = editFormData.password;
      }

      const res = await fetch(`/api/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadData();
        setEditingUser(null);
      } else {
        const err = await res.json();
        setEditError(err.error || 'Erro ao atualizar usuário');
      }
    } catch(err) {
      setEditError('Erro de conexão ao atualizar usuário');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este usuário (Exclusão Lógica)?')) return;
    setError('');
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsuarios(usuarios.filter(u => u.id !== id));
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao excluir usuário');
      }
    } catch(err) {
      setError('Erro de conexão ao excluir usuário');
    }
  };

  const canEditOrDelete = () => {
    return user?.role === 'ADMIN_GERAL';
  };

  const canDeleteUserObj = (u: UserRow) => {
    if (!canEditOrDelete()) return false;
    if (u.id === user?.id) return false;
    return u.role !== 'ADMIN_GERAL';
  };

  const startEdit = (u: UserRow) => {
    const matchedDel = delegacoes.find(d => d.nome === u.delegacaoNome);
    setEditingUser(u);
    setEditFormData({
      nome: u.nome,
      role: u.role,
      delegacaoId: matchedDel ? matchedDel.id : '',
      password: ''
    });
    setEditError('');
  };

  return (
    <div className="flex flex-col gap-6 flex-1 h-full">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 animate-fadeIn">
          {error}
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Cadastrar Novo Usuário
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome</label>
            <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
              value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">CPF</label>
            <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
               value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Senha</label>
            <input type="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Papel (Role)</label>
            <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
               {user?.role === 'ADMIN_GERAL' && <option value="MANAGER">Gerente</option>}
               <option value="MODERADOR">Moderador</option>
               {user?.role === 'ADMIN_GERAL' && <option value="ADMIN_GERAL">Admin Geral</option>}
            </select>
          </div>
          {formData.role === 'MODERADOR' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delegação</label>
              <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.delegacaoId} onChange={e => setFormData({...formData, delegacaoId: e.target.value})}>
                 <option value="">Selecione a Delegação</option>
                 {delegacoes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
          )}
          <div className="lg:col-span-3 flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Cadastrar Usuário
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
         <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Usuário</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">CPF</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Role</th>
                  <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Delegação</th>
                  <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {usuarios.map((u, idx) => (
                   <tr key={u.id || `u-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                     <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-700">{u.nome}</td>
                     <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500">{formatCPF(u.cpf)}</td>
                     <td className="px-8 py-5 whitespace-nowrap text-sm text-indigo-600 font-bold">{u.role}</td>
                     <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium bg-slate-50/30">{u.delegacaoNome}</td>
                     <td className="px-8 py-5 whitespace-nowrap text-sm text-right flex items-center justify-end gap-2">
                       {canEditOrDelete() && (
                         <button onClick={() => startEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                           <Edit2 className="w-5 h-5" />
                         </button>
                       )}
                       {canDeleteUserObj(u) && (
                         <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                           <Trash2 className="w-5 h-5" />
                         </button>
                       )}
                     </td>
                   </tr>
                ))}
                {usuarios.length===0 && <tr key="empty"><td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium bg-slate-50/30">Nenhum usuário cadastrado</td></tr>}
              </tbody>
            </table>
         </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden relative">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Usuário</h2>
              {editError && (
                <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 mb-6 animate-fadeIn">
                  {editError}
                </div>
              )}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.nome} onChange={e => setEditFormData({...editFormData, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Papel (Role)</label>
                  <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})}>
                     <option value="MANAGER">Gerente</option>
                     <option value="MODERADOR">Moderador</option>
                     <option value="ADMIN_GERAL">Admin Geral</option>
                  </select>
                </div>
                {editFormData.role === 'MODERADOR' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delegação</label>
                    <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={editFormData.delegacaoId} onChange={e => setEditFormData({...editFormData, delegacaoId: e.target.value})}>
                       <option value="">Selecione a Delegação</option>
                       {delegacoes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nova Senha (deixe em branco para não alterar)</label>
                  <input type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100">
                    Salvar Alterações
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
