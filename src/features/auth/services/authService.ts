import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '../types';

export const authService = {
    async getProfile(): Promise<Profile | null> {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Fetch profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }

        return profile as Profile;
    },

    async signOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
    }
};
