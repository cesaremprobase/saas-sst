import { createClient } from '@/lib/supabase/client';

export interface RewardInput {
    title: string;
    description: string;
    cost: number;
    image_url?: string;
    stock?: number;
}

export const storeService = {
    async createReward(data: RewardInput) {
        console.log('Creating reward with data:', data);
        const supabase = createClient();
        const { error } = await supabase
            .from('rewards')
            .insert(data);
        if (error) throw error;
    },

    async updateReward(id: string, data: RewardInput) {
        console.log('Updating reward', id, 'with data:', data);
        const supabase = createClient();
        const { error } = await supabase
            .from('rewards')
            .update(data)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteReward(id: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('rewards')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};
