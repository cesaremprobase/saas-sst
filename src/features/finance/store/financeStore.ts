import { create } from 'zustand';

interface FinanceState {
    selectedDate: string; // ISO Date YYYY-MM-DD
    activeTab: 'DELIVERY' | 'PAYMENT';

    setDate: (date: string) => void;
    setTab: (tab: 'DELIVERY' | 'PAYMENT') => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
    selectedDate: new Date().toISOString().split('T')[0],
    activeTab: 'DELIVERY',

    setDate: (date) => set({ selectedDate: date }),
    setTab: (tab) => set({ activeTab: tab }),
}));
