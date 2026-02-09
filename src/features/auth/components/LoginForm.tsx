"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/authService';

export function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authService.login({ email, password });
            router.push('/finance');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        setLoading(true);
        setError(null);
        try {
            await authService.signup({ email, password });
            alert('Usuario creado. Revisa tu correo o inicia sesión si el auto-confirm está activo.');
            // Try login immediately after signup just in case
            await authService.login({ email, password });
            router.push('/finance');
        } catch (err: any) {
            setError(err.message || 'Error al crear cuenta');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Iniciar Sesión</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="tu@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="********"
                        minLength={6}
                    />
                </div>

                <div className="flex gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? '...' : 'Entrar'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSignup}
                        disabled={loading}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        Crear Cuenta
                    </button>
                </div>
            </form>
        </div>
    );
}
