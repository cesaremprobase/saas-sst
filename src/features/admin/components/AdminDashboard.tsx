"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { financeService } from '../../finance/services/financeService';
import { authService } from '../../auth/services/authService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getPeruDate } from '@/lib/utils/date';

interface ClientDebt {
    id: string;
    name: string;
    order_index: number;
    debt: number;
}

import { EditTransactionModal } from '../../finance/components/EditTransactionModal';
import { Transaction } from '../../finance/types';

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<ClientDebt[]>([]);
    const [filter, setFilter] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'debt' | 'products' | 'clients_manage' | 'products_manage' | 'reports'>('overview');
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        if (!selectedDate) setSelectedDate(getPeruDate());
    }, []);

    // Data States
    const [dailyMoves, setDailyMoves] = useState<any[]>([]);
    const [productStats, setProductStats] = useState<any[]>([]);
    const [dailyIncome, setDailyIncome] = useState(0);
    const [dailyDeliveryValue, setDailyDeliveryValue] = useState(0);
    const [totalReceivable, setTotalReceivable] = useState(0);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedClientForEdit, setSelectedClientForEdit] = useState<{ name: string, transactions: Transaction[] } | null>(null);

    // ... existing useEffects ...

    // ... loadData functions ...

    // ... export functions ...





    useEffect(() => {
        checkAdmin();
    }, []);

    // Debug State
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setDebugLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);

    useEffect(() => {
        addLog('Dashboard MOUNTED');
        // Force critical check
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) addLog('CRITICAL: Missing Supabase URL');

        checkAdmin();
        // const interval = setInterval(() => {
        //     loadDailyData();
        //     if (activeTab === 'overview' || activeTab === 'products') loadProductStats();
        // }, 10000); 
        // return () => clearInterval(interval);
    }, [selectedDate, activeTab]);

    async function checkAdmin() {
        try {
            addLog('Starting checkAdmin...');

            // Safety timeout for checkAdmin
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout checking admin')), 8000)
            );

            addLog('Calling authService.getUserRole...');
            const role = await Promise.race([
                authService.getUserRole(),
                timeoutPromise
            ]) as string | null;

            addLog(`Role received: ${role}`);

            if (role !== 'admin') {
                addLog('Not admin, redirecting...');
                router.push('/finance');
                return;
            }
            setIsAdmin(true);
            addLog('Is admin, loading data...');
            await loadData();
        } catch (error) {
            console.error('Error checking admin role:', error);
            addLog(`Error checkAdmin: ${(error as any).message}`);
            alert('Error verificando administrador: ' + (error as any).message);
            setLoading(false);
        }
    };

    async function loadData() {
        try {
            addLog('Starting loadData...');
            setLoading(true);

            // Safety timeout to prevent infinite spinner
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout loading data')), 15000)
            );

            await Promise.race([
                Promise.all([
                    loadDebts().then(() => addLog('Debts loaded')),
                    loadDailyData().then(() => addLog('Daily loaded')),
                    loadProductStats().then(() => addLog('Stats loaded'))
                ]),
                timeoutPromise
            ]);

            addLog('Data loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            addLog(`Error loadData: ${(error as any).message}`);
            alert('Error cargando datos: ' + (error as any).message);
        } finally {
            addLog('Finished loading, setting loading=false');
            setLoading(false);
        }
    };

    async function loadDebts() {
        const data = await financeService.getAllClientsWithDebt();
        setClients(data);
        const total = data.reduce((acc, curr) => acc + (curr.debt || 0), 0);
        setTotalReceivable(total);
    };

    // ... (rest of code)

    if (loading) return (
        <div className="flex flex-col justify-center items-center h-screen bg-slate-950 gap-4 p-4">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
    );

    async function loadDailyData() {
        const data = await financeService.getDailyRouteSheet(selectedDate);
        setDailyMoves(data);

        // Calculate Totals for cards
        const income = data.reduce((sum, item) => sum + item.paidM + item.paidT, 0);
        const delivery = data.reduce((sum, item) => sum + item.deliveredM + item.deliveredT, 0);

        setDailyIncome(income);
        setDailyDeliveryValue(delivery);
    };

    async function loadProductStats() {
        const stats = await financeService.getProductStats();
        setProductStats(stats.slice(0, 5)); // Top 5
    };

    // EXPORT FUNCTIONS
    function exportToPDF() {
        const doc = new jsPDF();
        doc.text(`Reporte Diario de Cobranzas - ${selectedDate}`, 14, 10);

        const tableColumn = ["N°", "Cliente", "Entregado (M)", "Entregado (T)", "Pagado (M)", "Pagado (T)", "Deuda Total"];
        const tableRows: any[] = [];

        dailyMoves.forEach(row => {
            const rowData = [
                row.order_index,
                row.name,
                row.deliveredM > 0 ? row.deliveredM.toFixed(2) : '',
                row.deliveredT > 0 ? row.deliveredT.toFixed(2) : '',
                row.paidM > 0 ? row.paidM.toFixed(2) : '',
                row.paidT > 0 ? row.paidT.toFixed(2) : '',
                row.currentDebt > 0 ? row.currentDebt.toFixed(2) : '-'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133] }
        });

        doc.save(`reporte_diario_${selectedDate}.pdf`);
    };

    function exportToExcel() {
        const wsData = dailyMoves.map(row => ({
            "N°": row.order_index,
            "Cliente": row.name,
            "Entregado Mañana": row.deliveredM,
            "Entregado Tarde": row.deliveredT,
            "Pagado Mañana": row.paidM,
            "Pagado Tarde": row.paidT,
            "Deuda Total": row.currentDebt
        }));

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Diario");
        XLSX.writeFile(wb, `reporte_diario_${selectedDate}.xlsx`);
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-950">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500/30">
            {/* Modal */}
            {selectedClientForEdit && (
                <EditTransactionModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedClientForEdit(null);
                    }}
                    onUpdate={() => {
                        loadDailyData(); // Refresh data after edit
                    }}
                    clientName={selectedClientForEdit.name}
                    transactions={selectedClientForEdit.transactions}
                />
            )}
            {/* Navbar */}
            <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <span className="text-2xl mr-2">🏭</span>
                            <span className="font-bold text-lg tracking-tight">EMPROBASE <span className="text-cyan-400">ADMIN</span></span>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => {
                                    authService.logout();
                                    router.push('/login');
                                }}
                                className="mr-2 px-4 py-1.5 rounded-full text-xs font-bold bg-red-800 border border-red-700 text-red-100 hover:bg-red-700 transition-all"
                            >
                                CERRAR SESIÓN
                            </button>
                            <button
                                onClick={() => router.push('/finance')}
                                className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
                            >
                                VOLVER A TIENDA
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Status Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">💰</div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Por Cobrar Total</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">
                                S/ {totalReceivable.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </h3>
                            <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500/50 w-3/4"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">📅</div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas del Día</p>
                            <h3 className="text-3xl font-black text-cyan-400 tracking-tight">
                                S/ {dailyDeliveryValue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Entregado hoy</p>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">💵</div>
                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Cobrado Hoy</p>
                            <h3 className="text-3xl font-black text-emerald-400 tracking-tight">
                                S/ {dailyIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Dinero ingresado</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-hide">
                    {[
                        { id: 'overview', label: '📊 TENDENCIAS' },
                        { id: 'daily', label: '📅 HOJA DE RUTA' },
                        { id: 'debt', label: '📒 DEUDAS' },
                        { id: 'clients_manage', label: '👥 CLIENTES' },
                        { id: 'products_manage', label: '📦 PRODUCTOS' },
                        { id: 'reports', label: '📥 REPORTES' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-xl font-bold text-xs tracking-wide transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 scale-105'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="bg-slate-900/30 backdrop-blur-sm rounded-3xl border border-white/5 min-h-[500px]">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="p-4 rounded-full bg-slate-800/50 border border-white/5 mb-4">
                                <span className="text-4xl">👋</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Bienvenido al Panel de Control</h2>
                            <p className="text-slate-400 max-w-lg">
                                Selecciona una pestaña arriba para gestionar rutas, ver deudas o administrar clientes.
                                Sistema actualizado a v3.0 (Dark Mode).
                            </p>
                        </div>
                    )}

                    {/* DAILY SHEET TAB */}
                    {activeTab === 'daily' && (
                        <div>
                            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                                        <span className="text-2xl">🚛</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Hoja de Ruta</h2>
                                        <p className="text-xs text-slate-400">Control diario de entregas y cobros</p>
                                    </div>
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-slate-950 border border-white/10 text-white px-4 py-2 rounded-xl font-mono text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                                />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="p-4 border-b border-white/5 w-16 text-center">Ord</th>
                                            <th className="p-4 border-b border-white/5">Cliente</th>
                                            <th className="p-4 border-b border-white/5 text-center bg-cyan-900/10 border-r border-white/5" colSpan={2}>MAÑANA</th>
                                            <th className="p-4 border-b border-white/5 text-center bg-purple-900/10 border-r border-white/5" colSpan={2}>TARDE</th>
                                            <th className="p-4 border-b border-white/5 text-right">Deuda</th>
                                            <th className="p-4 border-b border-white/5 text-center w-16">Ver</th>
                                        </tr>
                                        <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                                            <th className="px-4 pb-2"></th>
                                            <th className="px-4 pb-2"></th>
                                            <th className="px-2 pb-2 text-center text-cyan-500 bg-cyan-900/10 border-r border-white/5">Entregado</th>
                                            <th className="px-2 pb-2 text-center text-emerald-500 bg-cyan-900/10 border-r border-white/5">Pagado</th>
                                            <th className="px-2 pb-2 text-center text-purple-500 bg-purple-900/10 border-r border-white/5">Entregado</th>
                                            <th className="px-2 pb-2 text-center text-emerald-500 bg-purple-900/10 border-r border-white/5">Pagado</th>
                                            <th className="px-4 pb-2 text-right">Actual</th>
                                            <th className="px-4 pb-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-white/5">
                                        {dailyMoves.map((row) => (
                                            <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 font-mono text-slate-500 text-center">{row.order_index}</td>
                                                <td className="p-4 font-bold text-slate-200">{row.name}</td>

                                                {/* MORNING */}
                                                <td className="p-2 text-center bg-cyan-900/5 border-r border-white/5 font-mono">
                                                    {row.deliveredM > 0 ? (
                                                        <span className="text-cyan-300">S/ {row.deliveredM.toFixed(2)}</span>
                                                    ) : <span className="text-slate-700">-</span>}
                                                </td>
                                                <td className="p-2 text-center bg-cyan-900/5 border-r border-white/5 font-mono">
                                                    {row.paidM > 0 ? (
                                                        <span className="text-emerald-400 font-bold">S/ {row.paidM.toFixed(2)}</span>
                                                    ) : <span className="text-slate-700">-</span>}
                                                </td>

                                                {/* AFTERNOON */}
                                                <td className="p-2 text-center bg-purple-900/5 border-r border-white/5 font-mono">
                                                    {row.deliveredT > 0 ? (
                                                        <span className="text-purple-300">S/ {row.deliveredT.toFixed(2)}</span>
                                                    ) : <span className="text-slate-700">-</span>}
                                                </td>
                                                <td className="p-2 text-center bg-purple-900/5 border-r border-white/5 font-mono">
                                                    {row.paidT > 0 ? (
                                                        <span className="text-emerald-400 font-bold">S/ {row.paidT.toFixed(2)}</span>
                                                    ) : <span className="text-slate-700">-</span>}
                                                </td>

                                                <td className="p-4 text-right font-mono font-bold text-white">
                                                    {row.currentDebt > 0 ? (
                                                        <span className="text-red-400">S/ {row.currentDebt.toFixed(2)}</span>
                                                    ) : <span className="text-slate-600">-</span>}
                                                </td>

                                                <td className="p-2 border-r border-white/5">
                                                    {(row.deliveredM > 0 || row.deliveredT > 0 || row.itemsM?.length > 0 || row.itemsT?.length > 0) ? (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedClientForEdit({
                                                                    name: row.name,
                                                                    transactions: row.transactions || []
                                                                });
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="w-full flex justify-center text-cyan-400 hover:text-white hover:scale-110 transition-all"
                                                        >
                                                            👁️
                                                        </button>
                                                    ) : <span className="text-slate-700">-</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* DEBT TAB */}
                    {activeTab === 'debt' && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clients
                                .filter(c => c.debt > 0)
                                .map(client => (
                                    <div key={client.id} className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 font-bold">
                                                {client.order_index}
                                            </div>
                                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                                                Deudor
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-white text-lg mb-1 truncate">{client.name}</h3>
                                        <p className="text-sm text-slate-500 mb-4">Deuda Total Acumulada</p>
                                        <div className="text-2xl font-mono font-black text-red-400">
                                            S/ {client.debt.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {/* PRODUCTS TAB (Ranking) */}
                    {activeTab === 'products' && (
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-6">Ranking de Ventas</h2>
                            <div className="space-y-4">
                                {productStats.map((prod, index) => {
                                    const maxVal = Math.max(...productStats.map(p => p.revenue));
                                    const width = (prod.revenue / maxVal) * 100;

                                    return (
                                        <div key={prod.name} className="relative group">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold text-slate-300">
                                                    <span className="text-cyan-500 mr-2">#{index + 1}</span>
                                                    {prod.name}
                                                </span>
                                                <span className="font-mono text-white">S/ {prod.revenue.toFixed(2)}</span>
                                            </div>
                                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full group-hover:from-cyan-400 group-hover:to-blue-400 transition-all duration-500"
                                                    style={{ width: `${width}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">{prod.quantity} unidades vendidas</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* CLIENTS MANAGEMENT TAB */}
                    {activeTab === 'clients_manage' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Gestión de Clientes</h2>
                                <button
                                    onClick={async () => {
                                        const name = prompt("Nombre del nuevo cliente:");
                                        if (!name) return;
                                        const order = prompt("Número de orden (Ruta):", (clients.length + 1).toString());
                                        if (!order) return;

                                        try {
                                            await financeService.createClient({ name, order_index: parseInt(order), initial_balance: 0, route: 'Cayhuayna 30' });
                                            loadDebts(); // Reload clients
                                            alert("Cliente creado exitosamente");
                                        } catch (e) { alert("Error al crear cliente"); }
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all"
                                >
                                    + NUEVO CLIENTE
                                </button>
                            </div>
                            <div className="bg-slate-950/50 rounded-xl border border-white/5 overflow-hidden">
                                {clients.map(client => (
                                    <div key={client.id} className="p-4 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 font-bold text-xs">{client.order_index}</span>
                                            <span className="font-bold text-slate-200">{client.name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    const newName = prompt("Nuevo nombre:", client.name);
                                                    if (newName === null) return;
                                                    const newOrder = prompt("Nuevo orden:", client.order_index.toString());

                                                    try {
                                                        await financeService.updateClient(client.id, {
                                                            name: newName || client.name,
                                                            order_index: newOrder ? parseInt(newOrder) : client.order_index
                                                        });
                                                        loadDebts();
                                                    } catch (e) { alert("Error al actualizar"); }
                                                }}
                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg hover:text-blue-300"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`¿Estás seguro de ELIMINAR a ${client.name}? Esto no se puede deshacer.`)) {
                                                        try {
                                                            await financeService.deleteClient(client.id);
                                                            loadDebts();
                                                        } catch (e) { alert("Error al eliminar"); }
                                                    }
                                                }}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg hover:text-red-300"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS MANAGEMENT TAB */}
                    {activeTab === 'products_manage' && (
                        <div className="p-6">
                            <ProductsManager />
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8">
                            <div className="p-6 rounded-full bg-slate-800/50 border border-white/5">
                                <span className="text-6xl">📥</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Centro de Descargas</h2>
                                <p className="text-slate-400 max-w-md mx-auto mb-6">
                                    Genera reportes oficiales para imprimir o archivar.
                                </p>

                                <div className="bg-slate-950 p-6 rounded-xl border border-white/10 max-w-sm mx-auto mb-8">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha del Reporte</label>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-white/10 text-white px-4 py-2 rounded-lg font-mono text-sm focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={exportToPDF}
                                        className="flex items-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 group"
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                                        <div>
                                            <div className="text-sm">DESCARGAR</div>
                                            <div className="text-xs opacity-75">FORMATO PDF</div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={exportToExcel}
                                        className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 group"
                                    >
                                        <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                                        <div>
                                            <div className="text-sm">DESCARGAR</div>
                                            <div className="text-xs opacity-75">FORMATO EXCEL</div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

// Subcomponent for Products Manager to handle local specific fetching
function ProductsManager() {
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const data = await financeService.getProducts();
        setProducts(data);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Gestión de Productos</h2>
                <button
                    onClick={async () => {
                        const name = prompt("Nombre del producto:");
                        if (!name) return;
                        const price = prompt("Precio unitario (S/):");
                        if (!price) return;

                        try {
                            await financeService.createProduct({ name, price: parseFloat(price) });
                            load();
                            alert("Producto creado");
                        } catch (e) { alert("Error al crear producto"); }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm transition-all"
                >
                    + NUEVO PRODUCTO
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(prod => (
                    <div key={prod.id} className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-cyan-500/30 transition-all">
                        <div>
                            <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{prod.name}</h4>
                            <p className="text-sm font-mono text-emerald-400">S/ {prod.price.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={async () => {
                                    const newPrice = prompt(`Nuevo precio para ${prod.name}:`, prod.price.toString());
                                    if (!newPrice) return;

                                    try {
                                        await financeService.updateProduct(prod.id, { price: parseFloat(newPrice) });
                                        load();
                                    } catch (e) { alert("Error al actualizar"); }
                                }}
                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                            >
                                ✏️
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm(`¿Eliminar ${prod.name}?`)) {
                                        try {
                                            await financeService.deleteProduct(prod.id);
                                            load();
                                        } catch (e) { alert("Error al eliminar"); }
                                    }
                                }}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
