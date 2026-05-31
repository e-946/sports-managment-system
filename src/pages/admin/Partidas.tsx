import { useEffect, useState } from 'react';
import { Partida, Esporte, Equipe } from '../../types';
import { Trophy, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Partidas() {
  const { user } = useAuth();
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [esportes, setEsportes] = useState<Esporte[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');
  
  const [formData, setFormData] = useState({
    esporteId: '',
    fase: 'Fase de Grupos',
    equipe1Id: '',
    equipe2Id: '',
    placar1: 0,
    placar2: 0,
    equipeVencedoraId: '',
    medalhaEquipe1: '',
    medalhaEquipe2: '',
  });

  const [editingMatch, setEditingMatch] = useState<Partida | null>(null);
  const [editFormData, setEditFormData] = useState({
    esporteId: '',
    fase: 'Fase de Grupos',
    equipe1Id: '',
    equipe2Id: '',
    placar1: 0,
    placar2: 0,
    equipeVencedoraId: '',
    medalhaEquipe1: '',
    medalhaEquipe2: '',
  });

  const loadData = () => {
    fetch('/api/partidas').then(r => r.json()).then(data => setPartidas(Array.isArray(data) ? data : []));
    fetch('/api/esportes').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setEsportes(arr);
      if (arr.length > 0) setFormData(p => ({ ...p, esporteId: arr[0].id }));
    });
    fetch('/api/equipes').then(r => r.json()).then(data => setEquipes(Array.isArray(data) ? data : []));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.equipe1Id === formData.equipe2Id) {
      setError("As equipes devem ser diferentes");
      return;
    }
    try {
      const res = await fetch('/api/partidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({...formData, placar1: Number(formData.placar1), placar2: Number(formData.placar2)})
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, equipe1Id: '', equipe2Id: '', placar1: 0, placar2: 0, equipeVencedoraId: '', medalhaEquipe1: '', medalhaEquipe2: '' }));
        loadData();
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao registrar partida');
      }
    } catch(err) {
      setError('Erro de conexão ao registrar partida');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    setEditError('');
    if (editFormData.equipe1Id === editFormData.equipe2Id) {
      setEditError("As equipes devem ser diferentes");
      return;
    }

    try {
      const res = await fetch(`/api/partidas/${editingMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          placar1: Number(editFormData.placar1),
          placar2: Number(editFormData.placar2)
        })
      });
      if (res.ok) {
        setEditingMatch(null);
        loadData();
      } else {
        const err = await res.json();
        setEditError(err.error || 'Erro ao atualizar partida');
      }
    } catch (err) {
      setEditError('Erro de conexão ao atualizar partida');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta partida (Soft Delete)?')) return;
    setError('');
    try {
      const res = await fetch(`/api/partidas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao excluir partida');
      }
    } catch (err) {
      setError('Erro de conexão ao excluir partida');
    }
  };

  const canEditOrDelete = () => {
    return ['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '');
  };

  const startEdit = (p: Partida) => {
    setEditingMatch(p);
    setEditFormData({
      esporteId: p.esporteId,
      fase: p.fase,
      equipe1Id: p.equipe1Id || '',
      equipe2Id: p.equipe2Id || '',
      placar1: p.placar1 || 0,
      placar2: p.placar2 || 0,
      equipeVencedoraId: p.equipeVencedoraId || '',
      medalhaEquipe1: p.medalhaEquipe1 || '',
      medalhaEquipe2: p.medalhaEquipe2 || '',
    });
    setEditError('');
  };

  const equipesFiltradas = equipes.filter(e => e.esporteId === formData.esporteId);
  const equipesFiltradasEdit = equipes.filter(e => e.esporteId === editFormData.esporteId);

  return (
    <div className="flex flex-col gap-6 flex-1 h-full font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Partidas e Confrontos</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Registre os resultados de cada fase.</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 animate-fadeIn">
          {error}
        </div>
      )}

      {/* Registrar Partida */}
      {canEditOrDelete() && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Registrar Partida
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Esporte/Modalidade</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                 value={formData.esporteId} onChange={e => setFormData({...formData, esporteId: e.target.value, equipe1Id:'', equipe2Id:'', equipeVencedoraId:''})}>
                 {esportes.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.categoria})</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fase da Partida</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                 value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})}>
                 <option value="Fase de Grupos">Fase de Grupos</option>
                 <option value="Quartas de Final">Quartas de Final</option>
                 <option value="Semifinal">Semifinal</option>
                 <option value="Final">Final</option>
                 <option value="Disputa 3º Lugar">Disputa 3º Lugar</option>
              </select>
            </div>

            <div className="lg:col-span-2 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Equipe 1</label>
                  <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" 
                     value={formData.equipe1Id} onChange={e => setFormData({...formData, equipe1Id: e.target.value})}>
                     <option value="">Selecione...</option>
                     {equipesFiltradas.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.delegacaoNome})</option>)}
                  </select>
               </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Placar</label>
                     <input type="number" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" 
                        value={formData.placar1} onChange={e => setFormData({...formData, placar1: Number(e.target.value)})} />
                  </div>
                  <div className="flex-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Medalha (Opcional)</label>
                     <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" 
                        value={formData.medalhaEquipe1} onChange={e => setFormData({...formData, medalhaEquipe1: e.target.value})}>
                        <option value="">Nenhuma</option>
                        <option value="OURO">Ouro</option>
                        <option value="PRATA">Prata</option>
                        <option value="BRONZE">Bronze</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-2 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Equipe 2</label>
                  <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" 
                     value={formData.equipe2Id} onChange={e => setFormData({...formData, equipe2Id: e.target.value})}>
                     <option value="">Selecione...</option>
                     {equipesFiltradas.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.delegacaoNome})</option>)}
                  </select>
               </div>
               <div className="flex gap-4">
                  <div className="flex-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Placar</label>
                     <input type="number" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" 
                        value={formData.placar2} onChange={e => setFormData({...formData, placar2: Number(e.target.value)})} />
                  </div>
                  <div className="flex-1">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Medalha (Opcional)</label>
                     <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" 
                        value={formData.medalhaEquipe2} onChange={e => setFormData({...formData, medalhaEquipe2: e.target.value})}>
                        <option value="">Nenhuma</option>
                        <option value="OURO">Ouro</option>
                        <option value="PRATA">Prata</option>
                        <option value="BRONZE">Bronze</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vencedor</label>
               <select className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700 font-bold transition-colors" 
                  value={formData.equipeVencedoraId} onChange={e => setFormData({...formData, equipeVencedoraId: e.target.value})}>
                  <option value="">Empate / N/A</option>
                  {formData.equipe1Id && <option value={formData.equipe1Id}>Equipe 1 Venceu</option>}
                  {formData.equipe2Id && <option value={formData.equipe2Id}>Equipe 2 Venceu</option>}
               </select>
            </div>

            <div className="lg:col-span-2 md:mt-2 lg:mt-0 flex justify-end">
               <button type="submit" className="w-full lg:w-auto bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 h-[50px] whitespace-nowrap">
                  <Plus className="w-5 h-5" /> Registrar Partida
               </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de partidas */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col animate-fadeIn">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="font-bold text-slate-800">Partidas Registradas</h3>
         </div>
         <div className="overflow-x-auto flex-1">
           <table className="min-w-full divide-y divide-slate-100">
             <thead className="bg-white">
               <tr>
                 <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Esporte/Fase</th>
                 <th className="px-8 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 w-1/3">Equipe 1</th>
                 <th className="px-8 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Placar</th>
                 <th className="px-8 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 w-1/3">Equipe 2</th>
                 {canEditOrDelete() && <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Ações</th>}
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 bg-white">
               {partidas.map((p, idx) => (
                  <tr key={p.id || `p-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                       <div className="font-bold text-slate-700">{p.esporteNome}</div>
                       <div className="text-slate-400 text-xs mt-1 font-medium">{p.fase}</div>
                    </td>
                    <td className={`px-8 py-5 text-center ${p.equipeVencedoraId === p.equipe1Id ? 'font-black text-emerald-600' : 'font-medium text-slate-600'}`}>
                      {p.equipe1Nome || '-'}
                      {p.medalhaEquipe1 && <span className="ml-1 text-xs">({p.medalhaEquipe1})</span>}
                    </td>
                    <td className="px-8 py-5 text-center font-black text-lg bg-slate-50/30 text-indigo-900 border-x border-slate-100">
                       {p.placar1 !== undefined ? p.placar1 : '-'} x {p.placar2 !== undefined ? p.placar2 : '-'}
                    </td>
                    <td className={`px-8 py-5 text-center ${p.equipeVencedoraId === p.equipe2Id ? 'font-black text-emerald-600' : 'font-medium text-slate-600'}`}>
                      {p.equipe2Nome || '-'}
                      {p.medalhaEquipe2 && <span className="ml-1 text-xs">({p.medalhaEquipe2})</span>}
                    </td>
                    {canEditOrDelete() && (
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-right flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    )}
                  </tr>
               ))}
               {partidas.length===0 && <tr key="empty"><td colSpan={canEditOrDelete() ? 5 : 4} className="px-8 py-16 text-center text-slate-400 font-medium bg-slate-50/30">Nenhuma partida registrada</td></tr>}
             </tbody>
           </table>
         </div>
      </div>

      {/* Edit Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden relative">
            <button 
              onClick={() => setEditingMatch(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Partida</h2>
              {editError && (
                <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 mb-6 animate-fadeIn">
                  {editError}
                </div>
              )}
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Esporte/Modalidade</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={editFormData.esporteId} onChange={e => setEditFormData({...editFormData, esporteId: e.target.value, equipe1Id:'', equipe2Id:'', equipeVencedoraId:''})}>
                      {esportes.map(es => <option key={es.id} value={es.id}>{es.nome} ({es.categoria})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Fase da Partida</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={editFormData.fase} onChange={e => setEditFormData({...editFormData, fase: e.target.value})}>
                      <option value="Fase de Grupos">Fase de Grupos</option>
                      <option value="Quartas de Final">Quartas de Final</option>
                      <option value="Semifinal">Semifinal</option>
                      <option value="Final">Final</option>
                      <option value="Disputa 3º Lugar">Disputa 3º Lugar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Equipe 1</label>
                        <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                           value={editFormData.equipe1Id} onChange={e => setEditFormData({...editFormData, equipe1Id: e.target.value})}>
                           <option value="">Selecione...</option>
                           {equipesFiltradasEdit.map(eq => <option key={eq.id} value={eq.id}>{eq.nome} ({eq.delegacaoNome})</option>)}
                        </select>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Placar</label>
                           <input type="number" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              value={editFormData.placar1} onChange={e => setEditFormData({...editFormData, placar1: Number(e.target.value)})} />
                        </div>
                        <div className="flex-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Medalha</label>
                           <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              value={editFormData.medalhaEquipe1} onChange={e => setEditFormData({...editFormData, medalhaEquipe1: e.target.value})}>
                              <option value="">Nenhuma</option>
                              <option value="OURO">Ouro</option>
                              <option value="PRATA">Prata</option>
                              <option value="BRONZE">Bronze</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Equipe 2</label>
                        <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                           value={editFormData.equipe2Id} onChange={e => setEditFormData({...editFormData, equipe2Id: e.target.value})}>
                           <option value="">Selecione...</option>
                           {equipesFiltradasEdit.map(eq => <option key={eq.id} value={eq.id}>{eq.nome} ({eq.delegacaoNome})</option>)}
                        </select>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Placar</label>
                           <input type="number" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              value={editFormData.placar2} onChange={e => setEditFormData({...editFormData, placar2: Number(e.target.value)})} />
                        </div>
                        <div className="flex-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Medalha</label>
                           <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              value={editFormData.medalhaEquipe2} onChange={e => setEditFormData({...editFormData, medalhaEquipe2: e.target.value})}>
                              <option value="">Nenhuma</option>
                              <option value="OURO">Ouro</option>
                              <option value="PRATA">Prata</option>
                              <option value="BRONZE">Bronze</option>
                           </select>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-6">
                  <div className="w-full sm:w-1/3">
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Vencedor</label>
                     <select className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-700 font-bold transition-colors"
                        value={editFormData.equipeVencedoraId} onChange={e => setEditFormData({...editFormData, equipeVencedoraId: e.target.value})}>
                        <option value="">Empate / N/A</option>
                        {editFormData.equipe1Id && <option value={editFormData.equipe1Id}>Equipe 1 Venceu</option>}
                        {editFormData.equipe2Id && <option value={editFormData.equipe2Id}>Equipe 2 Venceu</option>}
                     </select>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto justify-end">
                    <button type="button" onClick={() => setEditingMatch(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">
                      Cancelar
                    </button>
                    <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100">
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
