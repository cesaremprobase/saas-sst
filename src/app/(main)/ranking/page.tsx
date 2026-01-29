import { createClient } from '@/lib/supabase/server';
import { BackButton } from '@/shared/components/BackButton';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
    const supabase = createClient();
    const { data: profiles } = await (await supabase)
        .from('profiles')
        .select('*')
        .order('points', { ascending: false })
        .limit(50);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <BackButton />
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Ranking General</h2>
                <p className="text-white/60">
                    Los colaboradores más destacados de ZETA SAFE.
                </p>
            </div>

            <div className="bg-zgas-navy-light border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-white/60 text-sm uppercase">
                                <th className="p-4 pl-6 font-medium">Posición</th>
                                <th className="p-4 font-medium">Colaborador</th>
                                <th className="p-4 font-medium text-right pr-6">Puntos XP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {profiles?.map((profile, idx) => (
                                <tr key={profile.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-2">
                                            {idx === 0 && <span className="text-2xl">🥇</span>}
                                            {idx === 1 && <span className="text-2xl">🥈</span>}
                                            {idx === 2 && <span className="text-2xl">🥉</span>}
                                            {idx > 2 && <span className="font-mono text-white/40 font-bold ml-2">#{idx + 1}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-bold text-zgas-lime overflow-hidden">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    profile.full_name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{profile.full_name || 'Usuario Anónimo'}</div>
                                                <div className="text-xs text-white/40">{profile.role || 'Colaborador'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                        <span className="font-bold text-zgas-lime text-lg">
                                            {profile.points?.toLocaleString()} pts
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {!profiles?.length && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-white/40">
                                        No hay datos en el ranking todavía.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
