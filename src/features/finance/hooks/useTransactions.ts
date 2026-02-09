import { useState, useEffect } from 'react';
import { financeService } from '../services/financeService';
import { Transaction, TransactionType, Shift } from '../types';

export function useTransactions(date: string) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTransactions();
    }, [date]);

    async function loadTransactions() {
        try {
            setLoading(true);
            const data = await financeService.getTransactionsByDate(date);
            setTransactions(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function addTransaction(data: {
        client_id: string;
        type: TransactionType;
        shift?: Shift;
        amount: number;
        description?: string;
        products?: Record<string, number>;
    }) {
        try {
            const newTransaction = await financeService.createTransaction({
                ...data,
                date, // Use current selected date
            });
            setTransactions([newTransaction, ...transactions]);
            return newTransaction;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }

    // Derived state
    const totalDelivered = transactions
        .filter(t => t.type === 'DELIVERY')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalPaid = transactions
        .filter(t => t.type === 'PAYMENT')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        transactions,
        loading,
        error,
        addTransaction,
        refresh: loadTransactions,
        stats: {
            totalDelivered,
            totalPaid,
        }
    };
}
