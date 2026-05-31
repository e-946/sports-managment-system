import { useState, useEffect } from 'react';
import { Search, Activity, Trash2, ArrowRight, Eye, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export function Logs() {
  const [activeTab, setActiveTab] = useState<'updates' | 'deletes'>('updates');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = `/api/logs/${activeTab}?search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, search]);

  const formatEntityName = (tipo: string) => {
    switch (tipo) {
      case 'delegacao': return 'Delegação';
      case 'esporte': return 'Esporte';
      case 'participante': return 'Participante';
      case 'equipe': return 'Equipe';
      case 'partida': return 'Partida';
      case 'user': return 'Usuário';
      default: return tipo;
    }
  };

  return (
    <div className="flex flex-col gap-6 flex-1 h-full font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Audit logs do Sistema
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Histórico completo de auditoria das ações de atualização e exclusão.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition text-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </header>

      {/* Tabs Control */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => { setActiveTab('updates'); setSelectedChanges(null); }}
          className={`pb-4 text-sm font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'updates' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          Atualizações (Updates)
        </button>
        <button
          onClick={() => { setActiveTab('deletes'); setSelectedChanges(null); }}
          className={`pb-4 text-sm font-bold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'deletes' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Exclusões (Deletes)
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por CPF, usuário ou ID da entidade..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid: List and JSON Viewer side-by-side if update tab selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`${activeTab === 'updates' && selectedChanges ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Entidade</th>
                  <th className="px-6 py-4">ID do Registro</th>
                  <th className="px-6 py-4">Usuário</th>
                  {activeTab === 'updates' && <th className="px-6 py-4 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors font-medium">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        activeTab === 'updates' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {formatEntityName(log.tipoEntidade)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-[150px]">
                      {log.entidadeId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800 text-sm font-semibold">{log.usuarioNome}</span>
                        <span className="text-xs text-slate-500">CPF: {log.usuarioCpf}</span>
                      </div>
                    </td>
                    {activeTab === 'updates' && (
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedChanges(log)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-xl transition inline-flex items-center gap-1.5 text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detalhes
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'updates' ? 5 : 4} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Nenhum registro de log encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Change details viewer */}
        {activeTab === 'updates' && selectedChanges && (
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4 relative">
            <header className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Modificações</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedChanges.entidadeId}</p>
              </div>
              <button 
                onClick={() => setSelectedChanges(null)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Fechar
              </button>
            </header>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {Object.keys(selectedChanges.changes).map((key) => {
                const change = selectedChanges.changes[key];
                return (
                  <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{key}</span>
                    <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-2">
                      <div className="md:col-span-5 bg-rose-50 text-rose-800 border border-rose-100 p-2.5 rounded-xl text-xs font-mono break-all line-through">
                        {change.old === null || change.old === undefined ? 'null' : String(change.old)}
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-90 md:rotate-0" />
                      </div>
                      <div className="md:col-span-5 bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-xl text-xs font-mono break-all font-bold">
                        {change.new === null || change.new === undefined ? 'null' : String(change.new)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
