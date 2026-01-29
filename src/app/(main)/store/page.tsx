import { createClient } from '@/lib/supabase/server';
import { StoreGrid } from '@/features/store/components/StoreGrid';
import { BackButton } from '@/shared/components/BackButton';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get User Points & Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('points, role')
        .eq('id', user.id)
        .single();

    // Get Rewards
    const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .order('cost', { ascending: true });

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <BackButton />
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Tienda de Recompensas</h2>
                    <p className="text-white/60">
                        Canjea tus puntos ganados por beneficios reales.
                    </p>
                </div>

                <div className="bg-white/5 border border-zgas-lime/30 rounded-xl px-6 py-3 flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-xs text-white/60 uppercase font-bold tracking-wider">Tu Balance</div>
                        <div className="text-2xl font-bold text-zgas-lime">{profile?.points?.toLocaleString() || 0} pts</div>
                    </div>
                    <div className="w-10 h-10 bg-zgas-lime rounded-full flex items-center justify-center text-zgas-navy font-bold shadow-[0_0_15px_rgba(196,214,0,0.5)]">
                        ⚡
                    </div>
                </div>
            </div>

            <StoreGrid
                initialRewards={rewards || []}
                userPoints={profile?.points || 0}
                userRole={profile?.role || 'user'}
            />
        </div>
    );
}
