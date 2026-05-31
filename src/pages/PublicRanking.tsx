import React, { useEffect, useState } from 'react';
import { MedalRanking, Partida } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function PublicRanking() {
  const [ranking, setRanking] = useState<MedalRanking[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDelId, setExpandedDelId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/ranking').then(r => r.json()),
      fetch('/api/public/partidas').then(r => r.json())
    ]).then(([rData, pData]) => {
      setRanking(Array.isArray(rData) ? rData : []);
      setPartidas(Array.isArray(pData) ? pData : []);
      setLoading(false);
    });
  }, []);

  const toggleExpand = (id: string) => {
    if (expandedDelId === id) setExpandedDelId(null);
    else setExpandedDelId(id);
  };

  const getDelegationMedals = (delId: string) => {
    const medals: { id: string; esporte: string, equipe: string, medalha: string }[] = [];
    partidas.forEach(p => {
      if (p.medalhaEquipe1 && p.equipe1DelegacaoId === delId) {
         medals.push({ id: p.id+'-1', esporte: p.esporteNome || '', equipe: p.equipe1Nome || '', medalha: p.medalhaEquipe1 });
      }
      if (p.medalhaEquipe2 && p.equipe2DelegacaoId === delId) {
         medals.push({ id: p.id+'-2', esporte: p.esporteNome || '', equipe: p.equipe2Nome || '', medalha: p.medalhaEquipe2 });
      }
    });
    // sort medals by class
    return medals.sort((a,b) => {
       const order = { 'OURO': 1, 'PRATA': 2, 'BRONZE': 3 };
       return (order[a.medalha as keyof typeof order] || 4) - (order[b.medalha as keyof typeof order] || 4);
    });
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Carregando ranking...</div>;

  return (
    <div className="flex flex-col gap-6 flex-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Quadro de Medalhas</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Classificação geral por delegação. Clique na delegação para expandir e ver detalhes.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <h3 className="font-bold text-slate-800">Ranking Oficial</h3>
         </div>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-white">
            <tr>
              <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Delegação</th>
              <th className="px-8 py-5 text-center text-xs font-bold text-amber-500 uppercase tracking-widest bg-slate-50/50">Ouro</th>
              <th className="px-8 py-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">Prata</th>
              <th className="px-8 py-5 text-center text-xs font-bold text-amber-700 uppercase tracking-widest bg-slate-50/50">Bronze</th>
              <th className="px-8 py-5 text-center text-xs font-bold text-slate-800 uppercase tracking-widest bg-slate-50/50">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {ranking.map((row, index) => {
              const details = getDelegationMedals(row.delegacaoId);
              const isExpanded = expandedDelId === row.delegacaoId;
              
              return (
                <React.Fragment key={row.delegacaoId}>
                  <tr 
                    onClick={() => toggleExpand(row.delegacaoId)} 
                    className={`transition-colors cursor-pointer ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">{index + 1}</div>
                        <div className="flex-1 font-bold text-slate-700">{row.delegacaoNome}</div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-center font-black text-lg text-amber-500">{row.ouro}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-center font-black text-lg text-slate-400">{row.prata}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-center font-black text-lg text-amber-700">{row.bronze}</td>
                    <td className="px-8 py-5 whitespace-nowrap text-center font-black text-xl text-slate-900 bg-slate-50/30">{row.total}</td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="bg-slate-50 border-t border-slate-100">
                      <td colSpan={5} className="px-12 py-6">
                        {details.length === 0 ? (
                          <div className="text-slate-500 text-center py-4 font-medium">Nenhuma medalha conquistada detalhada nesta delegação.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {details.map((m, i) => (
                              <div key={m.id + i} className="flex flex-col p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`w-3 h-3 rounded-full 
                                    ${m.medalha === 'OURO' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''}
                                    ${m.medalha === 'PRATA' ? 'bg-slate-300' : ''}
                                    ${m.medalha === 'BRONZE' ? 'bg-amber-700' : ''}
                                  `}></span>
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{m.medalha}</span>
                                </div>
                                <div className="font-bold text-slate-800">{m.esporte}</div>
                                <div className="text-sm font-medium text-slate-500 mt-1">{m.equipe}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {ranking.length === 0 && (
              <tr key="empty">
                <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium">
                  Nenhuma medalha registrada no momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
