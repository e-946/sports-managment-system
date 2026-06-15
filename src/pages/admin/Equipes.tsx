import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Equipe, Esporte, Participante, Delegacao } from '../../types';
import { UsersRound, Plus, Edit2, Trash2, X } from 'lucide-react';

export function Equipes() {
  const { user } = useAuth();
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [esportes, setEsportes] = useState<Esporte[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [delegacoes, setDelegacoes] = useState<Delegacao[]>([]);

  const [formData, setFormData] = useState({
    nome: '',
    esporteId: '',
    delegacaoId: user?.delegacaoId || '',
    participanteIds: [] as string[]
  });

  const [editingTeam, setEditingTeam] = useState<Equipe | null>(null);
  const [editFormData, setEditFormData] = useState({
    nome: '',
    esporteId: '',
    delegacaoId: '',
    participanteIds: [] as string[]
  });

  const [partSearch, setPartSearch] = useState('');
  const [editPartSearch, setEditPartSearch] = useState('');
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const loadData = () => {
    fetch('/api/equipes').then(r => r.json()).then(data => setEquipes(Array.isArray(data) ? data : []));
    fetch('/api/esportes').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setEsportes(arr);
      if (arr.length > 0) setFormData(p => ({ ...p, esporteId: arr[0].id }));
    });
    fetch('/api/participantes').then(r => r.json()).then(data => setParticipantes(Array.isArray(data) ? data : []));
    fetch('/api/delegacoes').then(r => r.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setDelegacoes(arr);
      if (!formData.delegacaoId && arr.length > 0) setFormData(p => ({ ...p, delegacaoId: arr[0].id }));
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const toggleParticipant = (id: string, isEdit = false) => {
    if (isEdit) {
      setEditFormData(prev => {
        const isSelected = prev.participanteIds.includes(id);
        if (isSelected) {
          return { ...prev, participanteIds: prev.participanteIds.filter(pid => pid !== id) };
        } else {
          return { ...prev, participanteIds: [...prev.participanteIds, id] };
        }
      });
    } else {
      setFormData(prev => {
        const isSelected = prev.participanteIds.includes(id);
        if (isSelected) {
          return { ...prev, participanteIds: prev.participanteIds.filter(pid => pid !== id) };
        } else {
          return { ...prev, participanteIds: [...prev.participanteIds, id] };
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const currentEsporte = esportes.find(es => es.id === formData.esporteId);
    if (currentEsporte && currentEsporte.categoria !== 'MISTO') {
      const invalidParts = formData.participanteIds.some(id => {
        const p = participantes.find(part => part.id === id);
        return p && p.sexo !== currentEsporte.categoria;
      });
      if (invalidParts) {
        setError(`A equipe possui participantes com sexo inválido para a categoria ${currentEsporte.categoria}.`);
        return;
      }
    }

    const res = await fetch('/api/equipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setFormData(prev => ({ ...prev, nome: '', participanteIds: [] }));
      setError('');
      loadData();
    } else {
      const err = await res.json();
      setError(err.error || 'Erro ao formar equipe');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    setEditError('');

    const currentEditEsporte = esportes.find(es => es.id === editFormData.esporteId);
    if (currentEditEsporte && currentEditEsporte.categoria !== 'MISTO') {
      const invalidParts = editFormData.participanteIds.some(id => {
        const p = participantes.find(part => part.id === id);
        return p && p.sexo !== currentEditEsporte.categoria;
      });
      if (invalidParts) {
        setEditError(`A equipe possui participantes com sexo inválido para a categoria ${currentEditEsporte.categoria}.`);
        return;
      }
    }

    const res = await fetch(`/api/equipes/${editingTeam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFormData)
    });
    if (res.ok) {
      setEditingTeam(null);
      setEditError('');
      loadData();
    } else {
      const err = await res.json();
      setEditError(err.error || 'Erro ao atualizar equipe');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta equipe (Exclusão Lógica)? Todas as partidas associadas serão removidas logica e atomicamente.')) return;
    setError('');
    try {
      const res = await fetch(`/api/equipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao excluir equipe');
      }
    } catch (error) {
      setError('Erro de conexão ao excluir equipe');
    }
  };

  const canEditOrDelete = (e: Equipe) => {
    if (user?.role === 'ADMIN_GERAL' || user?.role === 'MANAGER') return true;
    if (user?.role === 'MODERADOR') {
      return e.delegacaoId === user.delegacaoId;
    }
    return false;
  };

  const startEdit = (e: Equipe) => {
    setEditingTeam(e);
    setEditError('');
    setEditFormData({
      nome: e.nome,
      esporteId: e.esporteId,
      delegacaoId: e.delegacaoId,
      participanteIds: e.participanteIds
    });
  };

  const currentEsporte = esportes.find(es => es.id === formData.esporteId);
  const availableParts = participantes.filter(p => {
    const matchesDelegation = p.delegacaoId === formData.delegacaoId;
    const matchesSearch = p.nomeAbreviado.toLowerCase().includes(partSearch.toLowerCase()) ||
      p.nomeCompleto.toLowerCase().includes(partSearch.toLowerCase());
      
    let matchesCategoria = true;
    if (currentEsporte && currentEsporte.categoria !== 'MISTO') {
      matchesCategoria = p.sexo === currentEsporte.categoria;
    }

    return matchesDelegation && matchesSearch && matchesCategoria;
  });

  const currentEditEsporte = esportes.find(es => es.id === editFormData.esporteId);
  const availableEditParts = participantes.filter(p => {
    const matchesDelegation = p.delegacaoId === editFormData.delegacaoId;
    const matchesSearch = p.nomeAbreviado.toLowerCase().includes(editPartSearch.toLowerCase()) ||
      p.nomeCompleto.toLowerCase().includes(editPartSearch.toLowerCase());
      
    let matchesCategoria = true;
    if (currentEditEsporte && currentEditEsporte.categoria !== 'MISTO') {
      matchesCategoria = p.sexo === currentEditEsporte.categoria;
    }

    return matchesDelegation && matchesSearch && matchesCategoria;
  });

  const groupedEquipes: Record<string, Record<string, Equipe[]>> = {};
  equipes.forEach(e => {
    const esporte = esportes.find(esp => esp.id === e.esporteId);
    const esporteNome = esporte?.nome || 'Desconhecido';
    const categoria = esporte?.categoria || 'Geral';

    if (!groupedEquipes[esporteNome]) groupedEquipes[esporteNome] = {};
    if (!groupedEquipes[esporteNome][categoria]) groupedEquipes[esporteNome][categoria] = [];

    groupedEquipes[esporteNome][categoria].push(e);
  });

  const getParticipantNames = (participanteIds: string[]) => {
    return participanteIds.map(id => {
      return participantes.find(p => p.id === id);
    }).filter(Boolean) as Participante[];
  };

  return (
    <div className="flex flex-col gap-6 flex-1 h-full font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Equipes e Atletas</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Forme equipes para as modalidades disponíveis.</p>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 animate-fadeIn">
          {error}
        </div>
      )}

      {/* Criar Nova Equipe */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Criar Nova Equipe
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome da Equipe</label>
              <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} placeholder="Ex: Dupla Dinâmica" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Esporte/Modalidade</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                value={formData.esporteId} onChange={e => setFormData({ ...formData, esporteId: e.target.value, participanteIds: [] })}>
                {esportes.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.categoria}) - Min: {e.minParticipantes} Max: {e.maxParticipantes}</option>)}
              </select>
            </div>

            {['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '') && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delegação Principal</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                  value={formData.delegacaoId} onChange={e => setFormData({ ...formData, delegacaoId: e.target.value, participanteIds: [] })}>
                  {delegacoes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-md shadow-indigo-200 mt-2 w-max">
              <Plus className="w-5 h-5" /> Formar Equipe
            </button>
          </div>

          <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Selecione os Participantes</label>
              <div className="text-xs text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg font-bold shadow-sm">
                {formData.participanteIds.length} / {currentEsporte?.maxParticipantes || '?'}
              </div>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Pesquisar participante..."
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={partSearch}
                onChange={e => setPartSearch(e.target.value)}
              />
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] pr-2 custom-scrollbar">
              {availableParts.map(p => (
                <label key={p.id} className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors shadow-sm">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    checked={formData.participanteIds.includes(p.id)}
                    onChange={() => toggleParticipant(p.id)} />
                  <div className="text-sm">
                    <p className="font-bold text-slate-700">{p.nomeAbreviado}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{p.delegacaoNome} • {p.sexo}</p>
                  </div>
                </label>
              ))}
              {availableParts.length === 0 && <div className="text-sm text-slate-400 text-center py-6 font-medium">Nenhum participante disponível na delegação.</div>}
            </div>
          </div>
        </form>
      </div>

      {/* Lista de equipes */}
      <div className="flex flex-col gap-10 mt-4 animate-fadeIn pb-8">
        {equipes.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-16 text-center text-slate-400 font-medium">
            Nenhuma equipe cadastrada.
          </div>
        )}
        {Object.entries(groupedEquipes).map(([esporteNome, categorias]) => (
          <div key={esporteNome} className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 border-b border-slate-200 pb-2">{esporteNome}</h2>
            {Object.entries(categorias).map(([categoria, equipesDaCategoria]) => (
              <div key={categoria} className="space-y-4">
                <h3 className="text-xl font-bold text-slate-700">Categoria: {categoria}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {equipesDaCategoria.map((e, index) => (
                    <div key={e.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-indigo-500 overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-indigo-200">
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Nº: {index + 1}</span>
                          {canEditOrDelete(e) && (
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(e.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-1">{e.delegacaoNome}</h4>
                        {e.nome !== e.delegacaoNome && (
                          <p className="text-sm text-slate-500 font-medium mb-4">{e.nome}</p>
                        )}
                        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                          {getParticipantNames(e.participanteIds).map((p, pIdx) => (
                            <div key={p.id} className="text-sm text-slate-600 flex items-center gap-2">
                              <span className="font-medium text-slate-400 text-xs w-4">{pIdx + 1}º</span>
                              <span className="font-medium">{p.nomeAbreviado}</span>
                            </div>
                          ))}
                          {e.participanteIds.length === 0 && (
                            <div className="text-sm text-slate-400 italic">Nenhum participante.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] relative">
            <button
              onClick={() => setEditingTeam(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 overflow-y-auto">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Equipe</h2>

              {editError && (
                <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 mb-6 animate-fadeIn">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome da Equipe</label>
                    <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={editFormData.nome} onChange={e => setEditFormData({ ...editFormData, nome: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Esporte/Modalidade</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      value={editFormData.esporteId} onChange={e => setEditFormData({ ...editFormData, esporteId: e.target.value, participanteIds: [] })}>
                      {esportes.map(es => <option key={es.id} value={es.id}>{es.nome} ({es.categoria}) - Min: {es.minParticipantes} Max: {es.maxParticipantes}</option>)}
                    </select>
                  </div>
                  {['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '') && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delegação Principal</label>
                      <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                        value={editFormData.delegacaoId} onChange={e => setEditFormData({ ...editFormData, delegacaoId: e.target.value, participanteIds: [] })}>
                        {delegacoes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setEditingTeam(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition w-full">
                      Cancelar
                    </button>
                    <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-100 w-full">
                      Salvar Alterações
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Selecione os Participantes</label>
                    <div className="text-xs text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg font-bold shadow-sm">
                      {editFormData.participanteIds.length} / {currentEditEsporte?.maxParticipantes || '?'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Pesquisar participante..."
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={editPartSearch}
                      onChange={e => setEditPartSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px] pr-2 custom-scrollbar">
                    {availableEditParts.map(p => (
                      <label key={p.id} className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-colors shadow-sm">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          checked={editFormData.participanteIds.includes(p.id)}
                          onChange={() => toggleParticipant(p.id, true)} />
                        <div className="text-sm">
                          <p className="font-bold text-slate-700">{p.nomeAbreviado}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{p.delegacaoNome} • {p.sexo}</p>
                        </div>
                      </label>
                    ))}
                    {availableEditParts.length === 0 && <div className="text-sm text-slate-400 text-center py-6 font-medium">Nenhum participante disponível na delegação.</div>}
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
