import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminDashboard() {
  const { user } = useAuth();
  
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [esportes, setEsportes] = useState<any[]>([]);
  const [delegacoes, setDelegacoes] = useState<any[]>([]);
  
  useEffect(() => {
    Promise.all([
      fetch('/api/participantes').then(r => r.json()),
      fetch('/api/equipes').then(r => r.json()),
      fetch('/api/esportes').then(r => r.json()),
      fetch('/api/delegacoes').then(r => r.json())
    ]).then(([parts, eqs, esps, dels]) => {
      setParticipantes(Array.isArray(parts) ? parts : []);
      setEquipes(Array.isArray(eqs) ? eqs : []);
      setEsportes(Array.isArray(esps) ? esps : []);
      setDelegacoes(Array.isArray(dels) ? dels : []);
    }).catch(console.error);
  }, []);

  const chartData = esportes.map(esp => {
    const eqCount = equipes.filter(eq => eq.esporteId === esp.id).length;
    return { name: esp.nome, equipes: eqCount };
  });

  const latestParts = [...participantes].reverse().slice(0, 5);
  const latestEqs = [...equipes].reverse().slice(0, 5);

  const userDelegacao = delegacoes.find(d => d.id === user?.delegacaoId);
  const userDelegacaoNome = userDelegacao ? userDelegacao.nome : user?.delegacaoId || '-';

  return (
    <div className="flex flex-col gap-6 flex-1 h-full">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard do Sistema</h1>
          <p className="text-slate-500 text-sm font-medium">
            {user?.role === 'MODERADOR' 
              ? `Visão geral da sua conta e permissões do sistema para a delegação: ${userDelegacaoNome}.` 
              : 'Visão geral da sua conta e permissões do sistema.'}
          </p>
        </div>
        <div className="hidden sm:flex gap-3">
          <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-bold flex items-center gap-2 text-slate-700 shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            SISTEMA: ONLINE
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Suas Permissões</h3>
            <p className="text-slate-600 mb-6 flex items-center gap-2">
              Você está logado como:
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg font-bold text-xs">{user?.role}</span>
            </p>
            
            <div className="text-sm text-slate-600 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              {['ADMIN_GERAL', 'MANAGER'].includes(user?.role || '') ? (
                 <ul className="list-disc pl-5 space-y-3 font-medium">
                   <li>Você pode criar e visualizar todas as delegações.</li>
                   <li>Você pode criar esportes e modalidades.</li>
                   <li>Você pode visualizar e criar equipes misturando delegações (se necessário).</li>
                   <li>Você pode registrar partidas e definir placares/medalhas.</li>
                 </ul>
              ) : (
                 <ul className="list-disc pl-5 space-y-3 font-medium">
                   <li>Você gerencia apenas a delegação: <strong className="text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-200 ml-1">{userDelegacaoNome}</strong></li>
                   <li>Você pode cadastrar novos participantes para a sua delegação.</li>
                   <li>Você pode criar equipes da sua delegação para os esportes disponíveis.</li>
                   <li>Você não pode registrar partidas ou criar esportes.</li>
                 </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Últimos Participantes</h3>
              <div className="space-y-3">
                {latestParts.map((p, i) => (
                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 text-sm">{p.nomeCompleto}</span>
                    <span className="text-xs text-slate-500">{p.delegacaoNome}</span>
                  </div>
                ))}
                {latestParts.length === 0 && <p className="text-sm text-slate-400">Nenhum participante</p>}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Últimas Equipes</h3>
              <div className="space-y-3">
                {latestEqs.map((e, i) => (
                  <div key={i} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 text-sm">{e.nome}</span>
                    <span className="text-xs text-slate-500">{e.esporteNome} - {e.delegacaoNome}</span>
                  </div>
                ))}
                {latestEqs.length === 0 && <p className="text-sm text-slate-400">Nenhuma equipe</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-emerald-500 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-emerald-200 h-40">
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-100">Status Geral</h3>
            <p className="text-3xl font-bold">Saudável</p>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white flex flex-col shadow-lg shadow-indigo-200 flex-1 relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-4">Equipes por Esporte</p>
              <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#c7d2fe" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.1)'}}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', color: '#333', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="equipes" fill="#fff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Background design */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
