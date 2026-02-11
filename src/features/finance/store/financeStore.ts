import { create } from 'zustand';
import { getPeruDate } from '@/lib/utils/date';

interface FinanceState {
    selectedDate: string; // ISO Date YYYY-MM-DD
    activeTab: 'DELIVERY' | 'PAYMENT';

    setDate: (date: string) => void;
    setTab: (tab: 'DELIVERY' | 'PAYMENT') => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
    selectedDate: '',
    activeTab: 'DELIVERY',

    setDate: (date) => set({ selectedDate: date }),
    setTab: (tab) => set({ activeTab: tab }),
}));
