'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { redeemReward } from '../actions';
import { RewardModal } from './RewardModal';

interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number;
    image_url: string;
}

interface StoreGridProps {
    initialRewards: Reward[];
    userPoints: number;
}

export function StoreGrid({ initialRewards, userPoints, userRole }: StoreGridProps & { userRole: string }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const router = useRouter();

    const handleRedeem = async (reward: Reward) => {
        if (userPoints < reward.cost) return;
        if (!confirm(`¿Estás seguro de canjear "${reward.title}" por ${reward.cost} puntos?`)) return;

        setLoadingId(reward.id);
        const result = await redeemReward(reward.id, reward.cost);
        setLoadingId(null);

        if (result.error) {
            alert(result.error);
        } else {
            alert('¡Canje exitoso! Disfruta tu premio.');
            router.refresh();
        }
    };

    const handleCreate = () => {
        setEditingReward(null);
        setIsModalOpen(true);
    };

    const handleEdit = (reward: Reward) => {
        setEditingReward(reward);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <>
            {userRole === 'admin' && (
                <div className="mb-6">
                    <button
                        onClick={handleCreate}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Administrar: Crear Premio
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialRewards.map((reward) => {
                    const canAfford = userPoints >= reward.cost;
                    const isLoading = loadingId === reward.id;

                    return (
                        <div key={reward.id} className="bg-zgas-navy-light border border-white/10 rounded-2xl overflow-hidden flex flex-col group relative">
                            {userRole === 'admin' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(reward); }}
                                    className="absolute top-2 left-2 z-10 bg-black/60 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors border border-white/20"
                                    title="Editar Premio"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                            )}

                            <div className="h-48 bg-white/5 relative overflow-hidden">
                                {reward.image_url && (
                                    <img
                                        src={reward.image_url}
                                        alt={reward.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                )}
                                <div className="absolute top-3 right-3 bg-zgas-navy/90 backdrop-blur px-3 py-1 rounded-full border border-zgas-lime/50">
                                    <span className="text-zgas-lime font-bold text-sm">{reward.cost} pts</span>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">{reward.title}</h3>
                                <p className="text-white/60 text-sm mb-6 flex-1">
                                    {reward.description}
                                </p>

                                <button
                                    onClick={() => handleRedeem(reward)}
                                    disabled={!canAfford || isLoading}
                                    className={`
                      w-full py-3 rounded-xl font-bold transition-all
                      ${canAfford
                                            ? 'bg-zgas-lime text-zgas-navy hover:bg-zgas-lime/90 hover:shadow-[0_0_20px_rgba(196,214,0,0.4)]'
                                            : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                                        }
                    `}
                                >
                                    {isLoading ? 'Canjeando...' : canAfford ? 'Canjear Recompensa' : 'Puntos Insuficientes'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <RewardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                initialData={editingReward}
            />
        </>
    );
}
