import { useEffect, useState } from 'react';
import { Esporte } from '../../types';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Esportes() {
  const { user } = useAuth();
  const [esportes, setEsportes] = useState<Esporte[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'MASCULINO',
    turno: '1',
    data: '',
    minParticipantes: 1,
    maxParticipantes: 1,
  });

  const [editingEsporte, setEditingEsporte] = useState<Esporte | null>(null);
  const [editFormData, setEditFormData] = useState({
    nome: '',
    categoria: 'MASCULINO',
    turno: '1',
    data: '',
    minParticipantes: 1,
    maxParticipantes: 1,
  });

  const loadData = () => {
    fetch('/api/esportes').then(res => res.json()).then(data => setEsportes(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/esportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setEsportes([...esportes, data]);
        setFormData({ ...formData, nome: '' });
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao cadastrar esporte');
      }
    } catch (e) {
      alert('Erro de conexão ao cadastrar esporte');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEsporte) return;
    try {
      const res = await fetch(`/api/esportes/${editingEsporte.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setEditingEsporte(null);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao atualizar esporte');
      }
    } catch (error) {
      alert('Erro de conexão ao atualizar esporte');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este esporte (Soft Delete)? Todas as equipes e partidas associadas serão removidas logica e atomicamente.')) return;
    try {
      const res = await fetch(`/api/esportes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao excluir esporte');
      }
    } catch (error) {
      alert('Erro de conexão ao excluir esporte');
    }
  };

  const canEditOrDelete = () => {
    return ['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '');
  };

  const startEdit = (esp: Esporte) => {
    setEditingEsporte(esp);
    setEditFormData({
      nome: esp.nome,
      categoria: esp.categoria,
      turno: String(esp.turno),
      data: esp.data || '',
      minParticipantes: esp.minParticipantes,
      maxParticipantes: esp.maxParticipantes,
    });
  };

  return (
    <div className="flex flex-col gap-6 flex-1 h-full font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Esportes e Modalidades</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Cadastre os esportes, categorias e regras de participantes.</p>
        </div>
      </header>

      {/* Novo Esporte */}
      {canEditOrDelete() && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Novo Esporte
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome</label>
              <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Futebol" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data</label>
              <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value as any})}>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
                <option value="MISTO">Misto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Turno</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.turno} onChange={e => setFormData({...formData, turno: e.target.value})}>
                <option value="1">1º Turno</option>
                <option value="2">2º Turno</option>
                <option value="3">3º Turno</option>
                <option value="4">4º Turno</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mín. Part.</label>
              <input type="number" min="1" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.minParticipantes} onChange={e => setFormData({...formData, minParticipantes: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Máx. Part.</label>
              <input type="number" min="1" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.maxParticipantes} onChange={e => setFormData({...formData, maxParticipantes: Number(e.target.value)})} />
            </div>
            <div className="md:col-span-2 lg:col-span-6 mt-4">
               <button type="submit" className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-md shadow-indigo-200 w-max">
                  <Plus className="w-5 h-5" /> Cadastrar Esporte
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de esportes */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col animate-fadeIn">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Tabela de Esportes</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Esporte</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Categoria</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Data/Turno</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Equipe (Mín/Máx)</th>
                {canEditOrDelete() && <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Ações</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {esportes.map((esp, idx) => (
                <tr key={esp.id || `esp-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-700">{esp.nome}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium bg-slate-50/30">{esp.categoria}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {esp.data ? new Date(esp.data + 'T12:00:00').toLocaleDateString('pt-BR') : '-'} - {esp.turno}º Turno
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium bg-slate-50/30">
                    {esp.minParticipantes} a {esp.maxParticipantes} participantes
                  </td>
                  {canEditOrDelete() && (
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-right flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(esp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(esp.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {esportes.length === 0 && (
                <tr key="empty"><td colSpan={canEditOrDelete() ? 5 : 4} className="px-8 py-16 text-center text-slate-400 font-medium bg-slate-50/30">Nenhum esporte cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEsporte && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden relative">
            <button 
              onClick={() => setEditingEsporte(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Esporte</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.nome} onChange={e => setEditFormData({...editFormData, nome: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data</label>
                  <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.data} onChange={e => setEditFormData({...editFormData, data: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.categoria} onChange={e => setEditFormData({...editFormData, categoria: e.target.value as any})}>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="MISTO">Misto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Turno</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.turno} onChange={e => setEditFormData({...editFormData, turno: e.target.value})}>
                    <option value="1">1º Turno</option>
                    <option value="2">2º Turno</option>
                    <option value="3">3º Turno</option>
                    <option value="4">4º Turno</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Mín. Part.</label>
                    <input type="number" min="1" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={editFormData.minParticipantes} onChange={e => setEditFormData({...editFormData, minParticipantes: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Máx. Part.</label>
                    <input type="number" min="1" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={editFormData.maxParticipantes} onChange={e => setEditFormData({...editFormData, maxParticipantes: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingEsporte(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">
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
