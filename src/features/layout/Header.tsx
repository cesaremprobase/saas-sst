'use client';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useUIStore } from '@/shared/store/uiStore';
import { useEffect } from 'react';

export function Header() {
    const { user, loadProfile, loading } = useAuthStore();
    const { toggleSidebar } = useUIStore();

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return (
        <header className="sticky top-0 z-40 bg-zgas-navy/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
            {/* Saludo Mobile/Desktop */}
            <div className="flex items-center gap-3">
                {/* Mobile Menu Button */}
                <button
                    onClick={toggleSidebar}
                    className="md:hidden text-zgas-lime hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                    {loading ? (
                        <span className="w-32 h-8 bg-white/10 animate-pulse rounded-lg block" />
                    ) : (
                        <>
                            <span>Hola, <span className="text-zgas-lime">{user?.full_name?.split(' ')[0] || 'Colaborador'}</span></span>
                            {user?.role === 'admin' && (
                                <span className="text-xs bg-zgas-lime text-zgas-navy px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Admin
                                </span>
                            )}
                        </>
                    )}
                </h1>
                <p className="text-sm text-white/60 hidden md:block">
                    {loading ? 'Cargando tu perfil...' : 'Tienes entrenamientos pendientes para hoy.'}
                </p>
            </div>

            {/* Actions & Balance */}
            <div className="flex items-center gap-4">
                {/* Quick Exchange Btn */}
                <button className="hidden md:flex items-center gap-2 bg-zgas-sapphire/20 hover:bg-zgas-sapphire/40 text-zgas-lime border border-zgas-lime/30 px-4 py-2 rounded-full transition-all text-sm font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    </svg>
                    Canjear Puntos
                </button>

                {/* Points Badge */}
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Tu Balance</span>
                        <span className="text-lg font-bold text-zgas-lime drop-shadow-[0_0_10px_rgba(196,214,0,0.5)]">
                            {user?.points?.toLocaleString() || 0} pts
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zgas-lime flex items-center justify-center text-zgas-navy">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                </div>
            </div>
        </header>
    );
}
