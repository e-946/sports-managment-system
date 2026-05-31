import React, { useEffect, useState } from 'react';
import { Partida, Esporte } from '../types';

export function PublicMatches() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [esportes, setEsportes] = useState<Esporte[]>([]);
  const [selectedEsporte, setSelectedEsporte] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/partidas').then(r => r.json()),
      fetch('/api/public/esportes').then(r => r.json())
    ]).then(([pData, eData]) => {
      setPartidas(Array.isArray(pData) ? pData : []);
      setEsportes(Array.isArray(eData) ? eData : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-12 text-center text-slate-500">Carregando partidas...</div>;

  const filteredPartidas = selectedEsporte ? partidas.filter(p => p.esporteId === selectedEsporte) : partidas;

  return (
    <div className="flex flex-col gap-6 flex-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Partidas e Confrontos</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Acompanhe os resultados dos jogos em tempo real.</p>
        </div>
        
        <div>
          <select 
            className="w-full sm:w-64 px-4 py-3 border border-slate-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-slate-700 outline-none"
            value={selectedEsporte}
            onChange={(e) => setSelectedEsporte(e.target.value)}
          >
            <option value="">Filtrar: Todos os Esportes</option>
            {esportes.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPartidas.map(p => (
          <div key={p.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">
                {p.esporteNome}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {p.fase}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <span className={`font-medium ${p.equipeVencedoraId === p.equipe1Id ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  {p.equipe1Nome || 'Desconhecida'}
                </span>
                <span className={`text-xl font-black ${p.equipeVencedoraId === p.equipe1Id ? 'text-emerald-500' : 'text-slate-700'}`}>{p.placar1 ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <span className={`font-medium ${p.equipeVencedoraId === p.equipe2Id ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                  {p.equipe2Nome || 'Desconhecida'}
                </span>
                <span className={`text-xl font-black ${p.equipeVencedoraId === p.equipe2Id ? 'text-emerald-500' : 'text-slate-700'}`}>{p.placar2 ?? '-'}</span>
              </div>
            </div>

            {(p.medalhaEquipe1 || p.medalhaEquipe2) && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                {p.medalhaEquipe1 && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className={`w-2 h-2 rounded-full ${p.medalhaEquipe1 === 'OURO' ? 'bg-amber-400' : p.medalhaEquipe1 === 'PRATA' ? 'bg-slate-300' : 'bg-amber-700'}`}></span>
                    Eq1: {p.medalhaEquipe1}
                  </div>
                )}
                {p.medalhaEquipe2 && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <span className={`w-2 h-2 rounded-full ${p.medalhaEquipe2 === 'OURO' ? 'bg-amber-400' : p.medalhaEquipe2 === 'PRATA' ? 'bg-slate-300' : 'bg-amber-700'}`}></span>
                    Eq2: {p.medalhaEquipe2}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {filteredPartidas.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
            Nenhuma partida encontrada ou registrada.
          </div>
        )}
      </div>
    </div>
  );
}
