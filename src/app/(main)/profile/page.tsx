'use client';

import { useAuthStore } from '@/features/auth/store/authStore';
import { BackButton } from '@/shared/components/BackButton';
import { RedemptionHistory } from '@/features/profile/components/RedemptionHistory';
import { useEffect } from 'react';

export default function ProfilePage() {
    const { user, loadProfile, loading } = useAuthStore();

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-zgas-lime">Cargando perfil...</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <BackButton />

            <div className="max-w-4xl mx-auto">
                <div className="bg-zgas-navy-light rounded-2xl p-8 border border-white/5">
                    <div className="flex items-start gap-8">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-zgas-lime flex items-center justify-center text-zgas-navy text-3xl font-bold">
                            {user?.full_name?.charAt(0) || 'U'}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-white">
                                    {user?.full_name || 'Usuario'}
                                </h1>
                                {user?.role === 'admin' && (
                                    <span className="bg-zgas-lime text-zgas-navy px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Admin
                                    </span>
                                )}
                            </div>

                            <div className="text-white/60 mb-6">
                                Miembro desde {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="text-sm text-white/60 mb-1">Puntos Totales</div>
                                    <div className="text-2xl font-bold text-zgas-lime">{user?.points || 0} pts</div>
                                </div>
                                {/* Add more stats here later */}
                            </div>

                            {/* Historial */}
                            {user?.id && <RedemptionHistory userId={user.id} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
