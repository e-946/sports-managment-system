import { useEffect, useState } from 'react';
import { Delegacao } from '../../types';
import { Flag, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Delegacoes() {
  const { user } = useAuth();
  const [delegacoes, setDelegacoes] = useState<Delegacao[]>([]);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingDelegacao, setEditingDelegacao] = useState<Delegacao | null>(null);
  const [editNome, setEditNome] = useState('');

  const loadData = () => {
    fetch('/api/delegacoes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDelegacoes(data);
        } else {
          setDelegacoes([]);
        }
      })
      .catch(() => setDelegacoes([]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/delegacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
      });
      if (!res.ok) {
         const err = await res.json();
         alert(err.error || 'Erro ao cadastrar delegação');
         return;
      }
      setNome('');
      loadData();
    } catch (error) {
      alert('Erro de conexão ao cadastrar delegação');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelegacao || !editNome.trim()) return;

    try {
      const res = await fetch(`/api/delegacoes/${editingDelegacao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: editNome })
      });
      if (res.ok) {
        setEditingDelegacao(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao atualizar delegação');
      }
    } catch (error) {
      alert('Erro de conexão ao atualizar delegação');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta delegação (Soft Delete)? Todos os participantes, equipes e usuários associados serão inativados logica e atomicamente.')) return;
    try {
      const res = await fetch(`/api/delegacoes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao excluir delegação');
      }
    } catch (error) {
      alert('Erro de conexão ao excluir delegação');
    }
  };

  const canEditOrDelete = () => {
    return ['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '');
  };

  const startEdit = (d: Delegacao) => {
    setEditingDelegacao(d);
    setEditNome(d.nome);
  };

  return (
    <div className="flex flex-col gap-6 flex-1 h-full font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Delegações</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Cadastre e gerencie as delegações do evento.</p>
        </div>
      </header>

      {/* Cadastro de delegação */}
      {canEditOrDelete() && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Nova Delegação
          </h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end max-w-2xl">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome da Delegação</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Polo Norte"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md shadow-indigo-200 h-[50px] whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Cadastrar
            </button>
          </form>
        </div>
      )}

      {/* Lista de delegações */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col animate-fadeIn">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Delegações Cadastradas</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 w-1/3">ID</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Nome</th>
                {canEditOrDelete() && <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 w-1/4">Ações</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {delegacoes.map((del, idx) => (
                <tr key={del.id || `del-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-400 font-mono">{del.id}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-700">{del.nome}</td>
                  {canEditOrDelete() && (
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-right flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(del)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(del.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {delegacoes.length === 0 && (
                <tr key="empty">
                  <td colSpan={canEditOrDelete() ? 3 : 2} className="px-8 py-16 text-center text-slate-400 font-medium bg-slate-50/30">
                    Nenhuma delegação cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingDelegacao && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative">
            <button 
              onClick={() => setEditingDelegacao(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Delegação</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome da Delegação</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editNome} 
                    onChange={e => setEditNome(e.target.value)} 
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingDelegacao(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">
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
