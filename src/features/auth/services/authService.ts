import { createClient } from '@/lib/supabase/client';
import { LoginCredentials, SignupCredentials } from '../types';

export const authService = {
    async login({ email, password }: LoginCredentials) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signup({ email, password, fullName }: SignupCredentials) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        if (error) throw error;
        return data;
    },

    async logout() {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getCurrentUser() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    async getUserRole() {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (error) console.error('Error fetching role:', error);

        return data?.role || 'user';
    }
};
