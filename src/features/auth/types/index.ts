export type UserRole = 'user' | 'admin';

export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    points: number;
    role: UserRole;
    created_at: string;
}

export interface AuthState {
    user: Profile | null; // We map Supabase User + Profile to this
    session: any | null; // Supabase Session
    loading: boolean;
    initialized: boolean;
}
