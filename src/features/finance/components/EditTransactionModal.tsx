import { useState } from 'react';
import { financeService } from '../services/financeService';
import { Transaction } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    clientName: string;
    transactions: Transaction[];
}

export function EditTransactionModal({ isOpen, onClose, onUpdate, clientName, transactions }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState<string>('');
    const [editDescription, setEditDescription] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleEditClick = (t: Transaction) => {
        setEditingId(t.id);
        setEditAmount(t.amount.toString());
        setEditDescription(t.description || '');
    };

    const handleSave = async (id: string) => {
        try {
            setLoading(true);
            await financeService.updateTransaction(id, {
                amount: parseFloat(editAmount),
                description: editDescription
            });
            setEditingId(null);
            onUpdate();
        } catch (e) {
            alert('Error al actualizar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        try {
            setLoading(true);
            await financeService.deleteTransaction(id);
            onUpdate();
        } catch (e) {
            alert('Error al eliminar');
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions by shift for display
    const morningTrans = transactions.filter(t => t.shift === 'MORNING');
    const afternoonTrans = transactions.filter(t => t.shift === 'AFTERNOON');

    const renderTransactionList = (list: Transaction[], title: string) => (
        <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 border-b border-white/10 pb-1">{title}</h4>
            {list.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No hay registros</p>
            ) : (
                <div className="space-y-2">
                    {list.map(t => (
                        <div key={t.id} className="bg-slate-800/50 p-3 rounded-lg border border-white/5 flex flex-col gap-2">
                            {editingId === t.id ? (
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        value={editAmount}
                                        onChange={e => setEditAmount(e.target.value)}
                                        className="w-24 bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-sm text-white"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        placeholder="Descripción"
                                        className="flex-1 bg-slate-900 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                    />
                                    <button
                                        onClick={() => handleSave(t.id)}
                                        disabled={loading}
                                        className="p-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30"
                                    >
                                        💾
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="p-1 text-slate-400 hover:text-white"
                                    >
                                        ❌
                                    </button>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${t.type === 'DELIVERY' ? 'text-cyan-400' : 'text-emerald-400'}`}>
                                                {t.type === 'DELIVERY' ? 'Entrega' : 'Pago'}: S/ {t.amount.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        {/* Products Detail */}
                                        <div className="text-xs text-slate-400 mt-1">
                                            {(t.items && t.items.length > 0) ? (
                                                t.items.map((i: any, idx: number) => (
                                                    <div key={idx}>- {i.quantity} {i.product_name}</div>
                                                ))
                                            ) : (t.products && Object.keys(t.products).length > 0) ? (
                                                Object.entries(t.products).map(([k, v]) => (
                                                    <div key={k}>- {v as number} {k}</div>
                                                ))
                                            ) : t.description ? (
                                                <div className="italic">"{t.description}"</div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEditClick(t)}
                                            className="p-1 text-blue-400 hover:bg-blue-500/10 rounded"
                                            title="Editar Monto/Nota"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                                            title="Eliminar Registro"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
                    <h3 className="font-bold text-white">
                        <span className="text-cyan-400 mr-2">✏️</span>
                        Editar: {clientName}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {renderTransactionList(morningTrans, "🌅 Mañana")}
                    {renderTransactionList(afternoonTrans, "🌇 Tarde")}
                    {renderTransactionList(transactions.filter(t => !t.shift), "📋 Otros")}
                </div>

                <div className="p-4 border-t border-white/10 bg-slate-950/50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
