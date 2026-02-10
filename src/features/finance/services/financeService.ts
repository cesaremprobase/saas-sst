import { createClient } from '@/lib/supabase/client';
import { Client, Transaction, TransactionType, Shift } from '../types';

export const financeService = {
    // ==========================================
    // CLIENTS MANAGEMENT
    // ==========================================
    async getClients() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('order_index', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return data as Client[];
    },

    async createClient(client: Omit<Client, 'id' | 'created_at' | 'user_id'>) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Usuario no autenticado');

        // Check if exists globally (Shared DB)
        const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('name', client.name)
            .single();

        if (existing) throw new Error('El cliente ya existe');

        const { data, error } = await supabase
            .from('clients')
            .insert({ ...client, user_id: user.id })
            .select()
            .single();

        if (error) throw error;
        return data as Client;
    },

    async updateClient(id: string, updates: Partial<Client>) {
        const supabase = createClient();
        const { error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteClient(id: string) {
        const supabase = createClient();

        // 1. Delete transactions (items cascade automatically)
        const { error: transError } = await supabase
            .from('transactions')
            .delete()
            .eq('client_id', id);

        if (transError) throw transError;

        // 2. Delete client
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateClientInitialBalance(client_id: string, amount: number) {
        const supabase = createClient();
        const { error } = await supabase
            .from('clients')
            .update({ initial_balance: amount })
            .eq('id', client_id);

        if (error) throw error;
    },

    async bulkCreateClients(clients: { name: string; order_index: number }[]) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { error } = await supabase.from('clients').upsert(
            clients.map(c => ({
                ...c,
                user_id: user.id,
                route: 'Cayhuayna 30'
            })),
            { onConflict: 'name' }
        );
        if (error) throw error;
    },

    // ==========================================
    // PRODUCTS MANAGEMENT
    // ==========================================
    async getProducts() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data as { id: string, name: string, price: number }[];
    },

    async createProduct(product: { name: string, price: number }) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await supabase
            .from('products')
            .insert({ ...product, user_id: user.id })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProduct(id: string, updates: { name?: string, price?: number }) {
        const supabase = createClient();
        const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteProduct(id: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async seedProducts(products: { name: string, price: number }[]) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Note: products table needs unique constraint on (name, user_id) for this to work perfectly,
        // but for now we just try to insert and ignore conflicts if constraint exists, or we should add constraint too.
        // Let's assume user might not have constraint yet, so we select first.

        // Better: Upsert matches on PK usually, but we want name. 
        // We'll trust the migration added constraint or just do a check loop if needed.
        // Actually, let's just do upsert with onConflict. If constraint is missing it loops.
        // To be safe in existing code:
        const { error } = await supabase.from('products').upsert(
            products.map(p => ({
                ...p,
                user_id: user.id
            })),
            { onConflict: 'name', ignoreDuplicates: true }
        );
        if (error) throw error;
    },

    async getProductStats(startDate?: string, endDate?: string) {
        const supabase = createClient();
        let query = supabase
            .from('transaction_items')
            .select('product_name, quantity, total_price');

        if (startDate) query = query.gte('created_at', startDate);
        if (endDate) query = query.lte('created_at', endDate);

        const { data, error } = await query;
        if (error) throw error;

        // Aggregate by Product
        const stats: Record<string, { quantity: number, revenue: number }> = {};

        data.forEach(item => {
            const current = stats[item.product_name] || { quantity: 0, revenue: 0 };
            stats[item.product_name] = {
                quantity: current.quantity + item.quantity,
                revenue: current.revenue + item.total_price
            };
        });

        return Object.entries(stats)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.quantity - a.quantity);
    },

    // ==========================================
    // TRANSACTIONS
    // ==========================================
    async getTransactionsByDate(date: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('transactions')
            .select('*, client:clients(*)')
            .eq('date', date)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Transaction[];
    },

    async createTransaction(transaction: {
        client_id: string;
        type: TransactionType;
        shift?: Shift;
        amount: number;
        description?: string;
        date: string;
        products?: Record<string, number>;
    }) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await supabase
            .from('transactions')
            .insert({ ...transaction, user_id: user.id })
            .select()
            .single();

        if (error) throw error;

        // Save detailed items if present
        if (transaction.products && Object.keys(transaction.products).length > 0) {
            // Get current product prices to freeze them in history
            const { data: dbProducts } = await supabase.from('products').select('name, price');
            const priceMap = new Map(dbProducts?.map(p => [p.name, p.price]) || []);

            const items = Object.entries(transaction.products).map(([name, qty]) => {
                const unitPrice = priceMap.get(name) || 0;
                return {
                    transaction_id: data.id,
                    product_name: name,
                    quantity: qty,
                    unit_price: unitPrice,
                    total_price: qty * unitPrice
                };
            });

            if (items.length > 0) {
                const { error: itemsError } = await supabase.from('transaction_items').insert(items);
                if (itemsError) console.error('Error saving items:', itemsError);
            }
        }

        return data as Transaction;
    },

    async getClientBalance(client_id: string) {
        const supabase = createClient();

        // 1. Get Initial Balance
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .select('initial_balance')
            .eq('id', client_id)
            .single();

        if (clientError) throw clientError;

        // 2. Get Transactions
        const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('client_id', client_id);

        if (transError) throw transError;

        let balance = Number(client?.initial_balance || 0);

        transactions?.forEach(t => {
            if (t.type === 'DELIVERY') balance += t.amount;
            if (t.type === 'PAYMENT') balance -= t.amount;
        });

        return balance;
    },

    // ==========================================
    // REPORTS (ADMIN)
    // ==========================================
    async getAllClientsWithDebt() {
        const supabase = createClient();

        // Fetch clients
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select(`
                id, 
                name, 
                order_index, 
                initial_balance
            `)
            .order('order_index', { ascending: true });

        if (clientsError) throw clientsError;

        // Fetch all transactions
        const { data: transactions, error: transError } = await supabase
            .from('transactions')
            .select('client_id, amount, type');

        if (transError) throw transError;

        // Calculate Debt
        const debtMap = new Map<string, number>();

        transactions?.forEach(t => {
            const current = debtMap.get(t.client_id) || 0;
            if (t.type === 'DELIVERY') debtMap.set(t.client_id, current + t.amount);
            if (t.type === 'PAYMENT') debtMap.set(t.client_id, current - t.amount);
        });

        return clients.map(c => {
            const transactionDebt = debtMap.get(c.id) || 0;
            const totalDebt = (c.initial_balance || 0) + transactionDebt;
            return {
                ...c,
                debt: totalDebt
            };
        });
    },

    async getDailyAdminReport(date: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                client:clients(name, order_index),
                items:transaction_items(*)
            `)
            .eq('date', date)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as (Transaction & { client: { name: string, order_index: number }, items: any[] })[];
    },

    async getDailyRouteSheet(date: string) {
        const supabase = createClient();

        // 1. Get all clients ordered
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, order_index, initial_balance')
            .order('order_index', { ascending: true });

        if (clientsError) throw clientsError;

        // 2. Get today's transactions with items
        const { data: todayTrans } = await supabase
            .from('transactions')
            .select('*, items:transaction_items(*)')
            .eq('date', date);

        // 3. Get total debt
        const { data: allTrans } = await supabase.from('transactions').select('client_id, amount, type');

        const debtMap = new Map<string, number>();
        allTrans?.forEach(t => {
            const current = debtMap.get(t.client_id) || 0;
            if (t.type === 'DELIVERY') debtMap.set(t.client_id, current + t.amount);
            if (t.type === 'PAYMENT') debtMap.set(t.client_id, current - t.amount);
        });

        // 4. Map data
        return clients.map(c => {
            const clientTrans = todayTrans?.filter(t => t.client_id === c.id) || [];

            // Helper to get items for a shift
            const getItems = (shift: string) => clientTrans
                .filter(t => t.type === 'DELIVERY' && t.shift === shift)
                .flatMap(t => t.items || []);

            const deliveredM = clientTrans.filter(t => t.type === 'DELIVERY' && t.shift === 'MORNING')
                .reduce((sum, t) => sum + t.amount, 0);
            const deliveredT = clientTrans.filter(t => t.type === 'DELIVERY' && t.shift === 'AFTERNOON')
                .reduce((sum, t) => sum + t.amount, 0);

            const paidM = clientTrans.filter(t => t.type === 'PAYMENT' && t.shift === 'MORNING')
                .reduce((sum, t) => sum + t.amount, 0);
            const paidT = clientTrans.filter(t => t.type === 'PAYMENT' && t.shift === 'AFTERNOON')
                .reduce((sum, t) => sum + t.amount, 0);

            const currentDebt = (c.initial_balance || 0) + (debtMap.get(c.id) || 0);

            return {
                id: c.id,
                order_index: c.order_index,
                name: c.name,
                deliveredM,
                deliveredT,
                paidM,
                paidT,
                currentDebt,
                itemsM: getItems('MORNING'),
                itemsT: getItems('AFTERNOON')
            };
        });
    }
};
