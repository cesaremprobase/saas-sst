"use client"

import { useRouter } from 'next/navigation';
import { useFinanceStore } from '../store/financeStore';
import { useTransactions } from '../hooks/useTransactions';
import { TransactionForm } from './TransactionForm';
import { DayStats } from './DayStats';
import { authService } from '../../auth/services/authService';
import { useState, useEffect } from 'react';
import { getPeruDate } from '@/lib/utils/date';

export default function FinanceDashboard() {
    const router = useRouter();
    const { selectedDate, setDate } = useFinanceStore();

    // Set default date to Peru time on mount if not set
    useEffect(() => {
        if (!selectedDate) setDate(getPeruDate());
    }, []);
    const { transactions, stats, refresh } = useTransactions(selectedDate);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        authService.getUserRole().then(role => setIsAdmin(role === 'admin'));
    }, []);

    return (
        <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">

            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        💰 Finanzas
                    </h1>
                    {isAdmin && (
                        <button
                            onClick={() => router.push('/admin')}
                            className="text-xs bg-gray-900 text-white px-3 py-1 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                        >
                            👑 ADMIN
                        </button>
                    )}
                </div>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-black"
                />
            </header>

            <main className="p-4">
                {/* Resumen del Día */}
                <DayStats delivered={stats.totalDelivered} paid={stats.totalPaid} />

                {/* Formulario de Ingreso */}
                <section className="mb-8">
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Nuevo Movimiento</h2>
                    <TransactionForm date={selectedDate} onSuccess={refresh} />
                </section>

                {/* Historial Reciente */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase mb-2">Movimientos ({transactions.length})</h2>

                    <div className="space-y-2">
                        {transactions.length === 0 && (
                            <p className="text-center text-gray-400 py-8 text-sm">No hay movimientos hoy.</p>
                        )}

                        {transactions.map(t => (
                            <div key={t.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-900">{t.client?.name || 'Cliente desconocido'}</p>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        <span className={t.type === 'DELIVERY' ? 'text-blue-600' : 'text-green-600 font-bold'}>
                                            {t.type === 'DELIVERY' ? 'ENTREGA' : 'PAGO'}
                                        </span>
                                        {t.shift && <span>• {t.shift === 'MORNING' ? 'Mañana' : 'Tarde'}</span>}
                                        <span>• {new Date(t.created_at!).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })}</span>
                                    </div>
                                    {/* Products Display */}
                                    {t.products && Object.keys(t.products).length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {Object.entries(t.products).map(([prod, qty]) => (
                                                <span key={prod} className="text-[10px] uppercase bg-gray-100 px-1 rounded border border-gray-200 text-gray-700 font-medium">
                                                    {prod}: {qty}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono font-bold ${t.type === 'DELIVERY' ? 'text-blue-700' : 'text-green-700'}`}>
                                        {t.type === 'PAYMENT' ? '+' : '-'} S/ {t.amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
