'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function SignupForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;

            // For now, redirect to home. In a real app, you might want to show a check email message.
            // But Supabase often defaults to auto-confirm off for dev, or signs in immediately.
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Crear Cuenta</h2>
                <p className="text-zgas-text-secondary">Únete a Z-Gas SST para empezar</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Nombre Completo</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-zgas-navy-light border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-zgas-lime focus:border-transparent transition-all"
                        placeholder="Juan Pérez"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Correo Electrónico</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zgas-navy-light border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-zgas-lime focus:border-transparent transition-all"
                        placeholder="juan@ejemplo.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zgas-navy-light border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-zgas-lime focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-zgas-lime hover:bg-zgas-lime/90 text-zgas-navy font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creando cuenta...' : 'Registrarse'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <span className="text-white/60">¿Ya tienes cuenta? </span>
                <Link href="/login" className="text-zgas-lime hover:underline font-medium">
                    Iniciar Sesión
                </Link>
            </div>
        </div>
    );
}
