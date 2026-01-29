'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function redeemReward(rewardId: string, cost: number) {
    const supabase = createClient();
    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    // 1. Check points
    const { data: profile } = await (await supabase)
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single();

    if (!profile || profile.points < cost) {
        return { error: 'Puntos insuficientes' };
    }

    // 2. Transacción (Simulada con llamadas secuenciales por ahora)
    // Restar puntos
    const { error: updateError } = await (await supabase)
        .from('profiles')
        .update({ points: profile.points - cost })
        .eq('id', user.id);

    if (updateError) return { error: 'Error al actualizar puntos' };

    // Crear redención
    const { error: redeemError } = await (await supabase)
        .from('redemptions')
        .insert({
            user_id: user.id,
            reward_id: rewardId,
            status: 'pending'
        });

    if (redeemError) return { error: 'Error al registrar canje' };

    revalidatePath('/store');
    revalidatePath('/ranking');
    revalidatePath('/'); // Update header points if displayed there

    return { success: true };
}
