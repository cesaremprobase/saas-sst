export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials extends LoginCredentials {
    fullName?: string;
}

export interface User {
    id: string;
    email?: string;
    user_metadata?: {
        full_name?: string;
    };
}
