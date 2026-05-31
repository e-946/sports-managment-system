import { Outlet, Link, useLocation } from 'react-router-dom';
import { Medal, Trophy, LogIn } from 'lucide-react';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 font-sans">
      <header className="bg-slate-900 rounded-3xl w-full max-w-7xl mx-auto flex items-center justify-between p-4 sm:px-6 text-white shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">Jogos Esportivos</h1>
        </div>
          
        <nav className="flex items-center gap-2 sm:gap-6">
          <Link 
            to="/partidas" 
            className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2", location.pathname === '/partidas' ? "bg-white/10 border border-white/10" : "text-slate-400 hover:text-white hover:bg-white/5")}
          >
            {location.pathname === '/partidas' && <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>}
            Partidas
          </Link>
          <Link 
            to="/ranking" 
            className={cn("px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2", location.pathname === '/ranking' ? "bg-white/10 border border-white/10" : "text-slate-400 hover:text-white hover:bg-white/5")}
          >
            {location.pathname === '/ranking' && <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>}
            <Medal className="h-4 w-4 hidden sm:block" />
            Ranking
          </Link>
        </nav>

        <div>
          <Link to="/login" className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all h-10 px-5 bg-indigo-600 text-white hover:bg-indigo-500 gap-2 shadow-lg shadow-indigo-600/30">
            <LogIn className="w-4 h-4 hidden sm:block" />
            Admin
          </Link>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-6">
        <Outlet />
      </main>

      <footer className="w-full max-w-7xl mx-auto text-center text-sm font-medium text-slate-400 pb-4">
        Sistema de Gestão Esportiva &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
