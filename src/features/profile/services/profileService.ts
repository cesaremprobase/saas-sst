import { createClient } from '@/lib/supabase/client';

export interface Redemption {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rewards: {
    title: string;
    image_url: string;
    cost: number;
  };
}

export const profileService = {
  async getRedemptions(userId: string): Promise<Redemption[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('redemptions')
      .select(`
        id,
        status,
        created_at,
        rewards (
          title,
          image_url,
          cost
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching redemptions:', error);
      return [];
    }

    return data as any;
  }
};
