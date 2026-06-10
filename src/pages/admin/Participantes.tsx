import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Participante, Delegacao } from '../../types';
import { Users, Plus, Download, Edit2, Trash2, X } from 'lucide-react';

export function formatCelular(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (clean.length === 0) return '';
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

export function formatCPF(value: string): string {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 4) return value;
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

export function Participantes() {
  const { user } = useAuth();
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [delegacoes, setDelegacoes] = useState<Delegacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    nomeAbreviado: '',
    cpf: '',
    dataNascimento: '',
    sexo: 'MASCULINO',
    celular: '',
    tipo: 'PARTICIPANTE',
    delegacaoId: user?.delegacaoId || ''
  });

  const [editingParticipant, setEditingParticipant] = useState<Participante | null>(null);
  const [editFormData, setEditFormData] = useState({
    nomeCompleto: '',
    nomeAbreviado: '',
    cpf: '',
    dataNascimento: '',
    sexo: 'MASCULINO',
    celular: '',
    tipo: 'PARTICIPANTE',
    delegacaoId: ''
  });

  const loadData = () => {
    fetch('/api/participantes').then(res => res.json()).then(data => setParticipantes(Array.isArray(data) ? data : []));
    fetch('/api/delegacoes').then(res => res.json()).then(data => {
      const arr = Array.isArray(data) ? data : [];
      setDelegacoes(arr);
      if (!formData.delegacaoId && arr.length > 0) {
         setFormData(prev => ({ ...prev, delegacaoId: arr[0].id }));
      }
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar idade > 10 anos
    const nascimento = new Date(formData.dataNascimento);
    const today = new Date();
    let idade = today.getFullYear() - nascimento.getFullYear();
    const m = today.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < nascimento.getDate())) {
      idade--;
    }

    if (idade < 10) {
      setError('Participante deve ter 10 anos ou mais.');
      setLoading(false);
      return;
    }

    const payload = { ...formData, idade };

    try {
      const res = await fetch('/api/participantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }
      setFormData({ ...formData, nomeCompleto: '', nomeAbreviado: '', cpf: '', celular: '', dataNascimento: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    setEditError('');
    try {
      const nascimento = new Date(editFormData.dataNascimento);
      const today = new Date();
      let idade = today.getFullYear() - nascimento.getFullYear();
      const m = today.getMonth() - nascimento.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < nascimento.getDate())) {
        idade--;
      }

      if (idade < 10) {
        setEditError('Participante deve ter 10 anos ou mais.');
        return;
      }

      const res = await fetch(`/api/participantes/${editingParticipant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editFormData, idade })
      });
      if (res.ok) {
        setEditingParticipant(null);
        loadData();
      } else {
        const err = await res.json();
        setEditError(err.error || 'Erro ao atualizar participante');
      }
    } catch (err) {
      setEditError('Erro de conexão ao atualizar participante');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este participante (Soft Delete)? Todas as associações de equipes serão removidas.')) return;
    setError('');
    try {
      const res = await fetch(`/api/participantes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadData();
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao excluir participante');
      }
    } catch (err) {
      setError('Erro de conexão ao excluir participante');
    }
  };

  const canEdit = (p: Participante) => {
    if (user?.role === 'ADMIN_GERAL' || user?.role === 'MANAGER') return true;
    if (user?.role === 'MODERADOR') {
      return p.delegacaoId === user.delegacaoId;
    }
    return false;
  };

  const canDelete = () => {
    return ['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '');
  };

  const startEdit = (p: Participante) => {
    setEditingParticipant(p);
    setEditFormData({
      nomeCompleto: p.nomeCompleto,
      nomeAbreviado: p.nomeAbreviado,
      cpf: formatCPF(p.cpf || ''),
      dataNascimento: p.dataNascimento,
      sexo: p.sexo as any,
      celular: formatCelular(p.celular || ''),
      tipo: p.tipo as any,
      delegacaoId: p.delegacaoId || ''
    });
    setEditError('');
  };

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nome,CPF,Idade,Sexo,Delegação\n" + 
      participantes.map(p => `${p.nomeCompleto},${p.cpf},${p.idade},${p.sexo},${p.delegacaoNome}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "participantes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 flex-1 h-full font-sans">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Participantes</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Cadastre e gerencie inscrições de atletas e administradores.</p>
        </div>
        <button onClick={exportExcel} className="bg-white border border-slate-200 text-slate-700 py-2.5 px-5 rounded-full font-bold text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all">
           <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exportar Planilha</span>
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 animate-fadeIn">
          {error}
        </div>
      )}

      {/* Novo Participante */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Novo Participante
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
             <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.nomeCompleto} onChange={e => setFormData({...formData, nomeCompleto: e.target.value})} />
          </div>
          <div className="text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Abreviado</label>
             <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.nomeAbreviado} onChange={e => setFormData({...formData, nomeAbreviado: e.target.value})} />
          </div>
          <div className="text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">CPF</label>
             <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} />
          </div>
          <div className="text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data Nascimento</label>
             <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.dataNascimento} onChange={e => setFormData({...formData, dataNascimento: e.target.value})} />
          </div>
          <div className="text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sexo</label>
             <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
               <option value="MASCULINO">Masculino</option>
               <option value="FEMININO">Feminino</option>
             </select>
          </div>
          <div className="text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Celular</label>
             <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.celular} onChange={e => setFormData({...formData, celular: formatCelular(e.target.value)})} />
          </div>
          <div className="text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo Usuário</label>
             <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                <option value="PARTICIPANTE">Participante Normal</option>
                <option value="MODERADOR">Admin Delegação</option>
                {user?.role === 'ADMIN_GERAL' && <option value="ADMIN_GERAL">Admin Geral</option>}
             </select>
          </div>
          <div className="text-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delegação</label>
             {user?.role === 'ADMIN_GERAL' || user?.role === 'MANAGER' ? (
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" 
                   value={formData.delegacaoId} onChange={e => setFormData({...formData, delegacaoId: e.target.value})}>
                  {delegacoes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
             ) : (
                <input type="text" disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium" 
                   value={delegacoes.find(d => d.id === user?.delegacaoId)?.nome || ''} />
             )}
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-4">
             <button type="submit" disabled={loading} className="bg-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-md shadow-indigo-200 w-max">
                <Plus className="w-5 h-5" /> Cadastrar Participante
             </button>
          </div>
        </form>
      </div>

      {/* Lista de participantes */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col animate-fadeIn">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Tabela de Participantes</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Nome</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Delegação</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Idade</th>
                <th className="px-8 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Categoria / Tipo</th>
                <th className="px-8 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {participantes.map((part, idx) => (
                <tr key={part.id || `part-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5 text-sm font-medium">
                    <div className="font-bold text-slate-700">{part.nomeAbreviado}</div>
                    <div className="text-slate-400 text-xs mt-1 font-mono">{formatCPF(part.cpf)}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium bg-slate-50/30">{part.delegacaoNome}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 font-medium">{part.idade} anos</td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm bg-slate-50/30">
                     <div className="text-slate-700 font-bold text-xs">{part.sexo}</div>
                     <div className="text-indigo-600 text-[10px] font-bold uppercase mt-1 px-2 py-0.5 bg-indigo-50 rounded inline-block">{part.tipo}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-right flex items-center justify-end gap-2">
                    {canEdit(part) && (
                      <button onClick={() => startEdit(part)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                    {canDelete() && (
                      <button onClick={() => handleDelete(part.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {participantes.length === 0 && (
                <tr key="empty"><td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium bg-slate-50/30">Nenhum participante cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden relative">
            <button 
              onClick={() => setEditingParticipant(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Participante</h2>
              {editError && (
                <div className="p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100 mb-6 animate-fadeIn">
                  {editError}
                </div>
              )}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.nomeCompleto} onChange={e => setEditFormData({...editFormData, nomeCompleto: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Abreviado</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.nomeAbreviado} onChange={e => setEditFormData({...editFormData, nomeAbreviado: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">CPF</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.cpf} onChange={e => setEditFormData({...editFormData, cpf: formatCPF(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Data Nascimento</label>
                  <input type="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.dataNascimento} onChange={e => setEditFormData({...editFormData, dataNascimento: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Sexo</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.sexo} onChange={e => setEditFormData({...editFormData, sexo: e.target.value as any})}>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Celular</label>
                  <input type="text" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.celular} onChange={e => setEditFormData({...editFormData, celular: formatCelular(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo Usuário</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    value={editFormData.tipo} onChange={e => setEditFormData({...editFormData, tipo: e.target.value as any})}>
                    <option value="PARTICIPANTE">Participante Normal</option>
                    <option value="MODERADOR">Admin Delegação</option>
                    {user?.role === 'ADMIN_GERAL' && <option value="ADMIN_GERAL">Admin Geral</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Delegação</label>
                  {user?.role === 'ADMIN_GERAL' || user?.role === 'MANAGER' ? (
                     <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                        value={editFormData.delegacaoId} onChange={e => setEditFormData({...editFormData, delegacaoId: e.target.value})}>
                       {delegacoes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                     </select>
                  ) : (
                     <input type="text" disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium" 
                        value={delegacoes.find(d => d.id === user?.delegacaoId)?.nome || ''} />
                  )}
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingParticipant(null)} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition">
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
