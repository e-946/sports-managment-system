import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, LogIn } from 'lucide-react';

export function Login() {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao logar');
      }
      
      login(data);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 w-full relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-2 bg-indigo-500"></div>
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
          <Trophy className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Acesso Restrito</h2>
        <p className="text-slate-500 mt-2 text-center text-sm font-medium">Faça login com suas credenciais de administrador.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 font-bold rounded-2xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">CPF</label>
          <input
            type="text"
            required
            placeholder="Digite seu CPF (apenas números)"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            value={cpf}
            onChange={e => setCpf(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Senha</label>
          <input
            type="password"
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 bg-indigo-600 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all text-sm uppercase tracking-wider"
        >
          {loading ? 'Validando...' : <><LogIn className="w-5 h-5" /> Entrar no Sistema</>}
        </button>
      </form>
      
      <div className="mt-8 pt-8 border-t border-slate-100 text-xs font-medium text-slate-400 text-center bg-slate-50 -mx-10 -mb-10 px-10 pb-10">
        <p>Acesso padrão mockado (primeiro login):</p>
        <p className="font-mono mt-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block text-slate-600">CPF: admin | Senha: admin</p>
      </div>
    </div>
  );
}
