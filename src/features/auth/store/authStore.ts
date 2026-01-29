import { create } from 'zustand';
import { AuthState, Profile } from '../types';
import { authService } from '../services/authService';

interface AuthStore extends AuthState {
    setUser: (user: Profile | null) => void;
    loadProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,

    setUser: (user) => set({ user }),

    loadProfile: async () => {
        try {
            set({ loading: true });
            const profile = await authService.getProfile();
            set({ user: profile, initialized: true });
        } catch (error) {
            console.error('Failed to load profile:', error);
            set({ user: null, initialized: true });
        } finally {
            set({ loading: false });
        }
    },

    signOut: async () => {
        await authService.signOut();
        set({ user: null, session: null });
    },
}));
