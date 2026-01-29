'use client';

import { useEffect, useState } from 'react';
import { Redemption, profileService } from '../services/profileService';

interface Props {
    userId: string;
}

export function RedemptionHistory({ userId }: Props) {
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!userId) return;
            try {
                const data = await profileService.getRedemptions(userId);
                setRedemptions(data);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [userId]);

    if (loading) return <div className="text-white/40 text-sm animate-pulse">Cargando historial...</div>;
    if (!redemptions.length) return <div className="text-white/40 text-sm">Aún no has canjeado premios.</div>;

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">Historial de Canjes</h3>
            <div className="grid grid-cols-1 gap-3">
                {redemptions.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                        {/* Image */}
                        <div className="w-16 h-16 rounded-lg bg-black/20 overflow-hidden flex-shrink-0">
                            {item.rewards?.image_url && (
                                <img src={item.rewards.image_url} alt={item.rewards.title} className="w-full h-full object-cover" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="font-bold text-white">{item.rewards?.title || 'Premio'}</div>
                            <div className="text-zgas-lime text-sm font-bold">-{item.rewards?.cost} pts</div>
                            <div className="text-white/40 text-xs mt-1">
                                {new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <StatusBadge status={item.status} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        approved: 'bg-green-500/20 text-green-500 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
    };

    const labels = {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
    };

    const s = status as keyof typeof styles;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[s] || styles.pending}`}>
            {labels[s] || status}
        </span>
    );
}
