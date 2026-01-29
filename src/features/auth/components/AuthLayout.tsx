import { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#003366] to-[#001F3F] flex flex-col items-center justify-center p-4">
            <div className="w-full flex justify-center mb-8">
                <div className="flex flex-col items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/logo.jpg"
                        alt="ZETA SAFE Logo"
                        className="h-20 w-auto object-contain bg-white rounded-lg p-2"
                    />
                    <span className="text-2xl font-bold text-white text-center">
                        ZETA <span className="text-zgas-lime">SAFE</span>
                        <span className="block text-sm font-normal text-white/70 mt-1">Plataforma de Capacitación SST</span>
                    </span>
                </div>
            </div>
            {children}
        </div>
    );
}
