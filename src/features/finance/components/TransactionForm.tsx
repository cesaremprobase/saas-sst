"use client"

import { useState, useEffect, useRef } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { financeService } from '../services/financeService';
import { authService } from '../../auth/services/authService';
import { Client, Shift, Product } from '../types';
import { INITIAL_CLIENTS } from '../data/initialClients';
import { INITIAL_PRODUCTS } from '../data/initialProducts';
import Fuse from 'fuse.js';
import { getPeruDate } from '@/lib/utils/date';

interface Props {
    date: string;
    onSuccess?: () => void;
}

export function TransactionForm({ date, onSuccess }: Props) {
    const { addTransaction } = useTransactions(date);
    const [clients, setClients] = useState<Client[]>([]);
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const searchRef = useRef<HTMLDivElement>(null);

    // Form State
    const [clientId, setClientId] = useState('');
    const [deliveryAmount, setDeliveryAmount] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [shift, setShift] = useState<Shift>('MORNING');
    const [loading, setLoading] = useState(false);

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // ... (rest of state) ...

    const processVoiceCommand = (text: string) => {
        console.log("Comando de voz:", text);
        let lower = text.toLowerCase();

        // 0. Normalize Numbers
        const numberMap: Record<string, string> = {
            'un': '1', 'una': '1', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4',
            'cinco': '5', 'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10',
            'once': '11', 'doce': '12', 'quince': '15', 'veinte': '20'
        };
        Object.entries(numberMap).forEach(([word, num]) => {
            lower = lower.replace(new RegExp(`\\b${word}\\b`, 'g'), num);
        });

        // A. Find Client
        const clientFuse = new Fuse(clients, { keys: ['name', 'order_index'], threshold: 0.4 });
        const clientResult = clientFuse.search(lower)?.[0];

        if (clientResult) {
            selectClient(clientResult.item);
        }

        // B. Find Products
        // Iterate through detected numbers to find products near them
        // Better: Iterate through products and look for patterns
        availableProducts.forEach(prod => {
            const safeName = prod.name.toLowerCase();
            const singular = safeName.endsWith('s') ? safeName.slice(0, -1) : safeName;

            // Regex: Number + (optional 'de') + Product (with optional 'es'/'s')
            // Regex: Number + (optional 'de') + Product (with optional 'es'/'s')
            try {
                // R1: "5 de pan", "5 panes"
                const regex1 = new RegExp(`(\\d+)\\s*(de\\s*)?${singular}(es|s)?\\b`, 'i');
                const match1 = lower.match(regex1);

                // R2: "Panes 5", "Pan 5"
                const regex2 = new RegExp(`${singular}(es|s)?\\s*(de\\s*)?(\\d+)\\b`, 'i');
                const match2 = lower.match(regex2);

                if (match1) {
                    handleProductQtyChange(prod.name, match1[1]);
                } else if (match2) {
                    handleProductQtyChange(prod.name, match2[3]);
                }
            } catch (e) { }
        });

        // C. Find Payment
        // Patterns: "pago 20", "20 soles", "abono 50"
        const paymentRegexLocal = /(pago|abono|cuenta|acuenta)\s*(de)?\s*(\d+(\.\d{1,2})?)/i;
        const solesRegex = /(\d+(\.\d{1,2})?)\s*(soles|so|lucas)/i;

        const payMatch = lower.match(paymentRegexLocal);
        const solesMatch = lower.match(solesRegex);

        if (payMatch) {
            setPaymentAmount(payMatch[3]);
        } else if (solesMatch) {
            setPaymentAmount(solesMatch[1]);
        }

        // D. Find Shift
        if (lower.includes('tarde') || lower.includes('noche')) {
            setShift('AFTERNOON');
        } else if (lower.includes('mañana') || lower.includes('dia') || lower.includes('día')) {
            setShift('MORNING');
        }
    };

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true; // Keep listening
            recognition.lang = 'es-PE';
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => {
                // Only stop if user manually stopped it (we handle this via state check if needed, 
                // but for now let's just update UI. If continuous, it shouldn't stop often.)
                setIsListening(false);
            };

            recognition.onresult = (event: any) => {
                const resultsLength = event.results.length;
                if (resultsLength > 0) {
                    const latest = event.results[resultsLength - 1];
                    if (latest.isFinal) {
                        const transcript = latest[0].transcript;
                        processVoiceCommand(transcript);
                    }
                }
            };

            recognitionRef.current = recognition;
        }
    }, [clients, availableProducts]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    // Product State
    const [productQuantities, setProductQuantities] = useState<Record<string, string>>({});

    // Debt State
    const [currentDebt, setCurrentDebt] = useState<number | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    const loadData = async () => {
        try {
            const [clientsData, productsData, role] = await Promise.all([
                financeService.getClients(),
                financeService.getProducts(),
                authService.getUserRole()
            ]);
            setClients(clientsData);
            setFilteredClients(clientsData);
            setAvailableProducts(productsData);
            setIsAdmin(role === 'admin');
        } catch (e) {
            console.error(e);
        }
    };

    const loadClientDebt = async (id: string) => {
        try {
            const debt = await financeService.getClientBalance(id);
            setCurrentDebt(debt);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData();

        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ... (Total calculation effect remains) ...
    // Helper to calculate total
    useEffect(() => {
        let total = 0;
        availableProducts.forEach(prod => {
            const qty = Number(productQuantities[prod.name] || 0);
            if (qty > 0) {
                total += qty * prod.price;
            }
        });

        if (total > 0) {
            setDeliveryAmount(total.toFixed(2));
        } else if (Object.values(productQuantities).every(v => !v)) {
            setDeliveryAmount('');
        }
    }, [productQuantities, availableProducts]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredClients(clients);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredClients(clients.filter(c =>
                c.name.toLowerCase().includes(lower) ||
                c.order_index?.toString().includes(lower)
            ));
        }
    }, [searchTerm, clients]);

    const selectClient = (client: Client) => {
        setClientId(client.id);
        const nameDisplay = client.order_index ? `${client.order_index}. ${client.name}` : client.name;
        setSearchTerm(nameDisplay);
        setShowDropdown(false);
        loadClientDebt(client.id);
    };

    const handleEditDebt = async () => {
        const newDebt = prompt('Ingresa la nueva DEUDA INICIAL del cliente (S/):', '0');
        if (newDebt !== null) {
            try {
                await financeService.updateClientInitialBalance(clientId, Number(newDebt));
                loadClientDebt(clientId);
            } catch (e) {
                alert('Error al actualizar deuda: ' + e);
            }
        }
    };

    const handleSeedClients = async () => {
        if (!confirm('¿Cargar los 57 clientes iniciales?')) return;
        setLoading(true);
        try {
            await financeService.bulkCreateClients(INITIAL_CLIENTS);
            loadData();
            alert('Clientes cargados.');
        } catch (e) {
            alert('Error: ' + e);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedProducts = async () => {
        if (!confirm('¿Cargar productos y precios iniciales?')) return;
        setLoading(true);
        try {
            await financeService.seedProducts(INITIAL_PRODUCTS);
            loadData();
            alert('Productos cargados.');
        } catch (e) {
            alert('Error: ' + e);
        } finally {
            setLoading(false);
        }
    };

    const toggleProduct = (prodName: string) => {
        setProductQuantities(prev => {
            const current = prev[prodName];
            if (current !== undefined) {
                const copy = { ...prev };
                delete copy[prodName];
                return copy;
            } else {
                return { ...prev, [prodName]: '' };
            }
        });
    };

    const handleProductQtyChange = (prodName: string, val: string) => {
        setProductQuantities(prev => ({
            ...prev,
            [prodName]: val
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) {
            alert("Selecciona un cliente");
            return;
        }

        const productsToSave: Record<string, number> = {};
        Object.entries(productQuantities).forEach(([key, val]) => {
            if (val && Number(val) > 0) productsToSave[key] = Number(val);
        });
        const hasProducts = Object.keys(productsToSave).length > 0;

        if (!deliveryAmount && !paymentAmount && !hasProducts) {
            alert("Ingresa un monto o selecciona productos.");
            return;
        }

        setLoading(true);
        try {
            const promises = [];

            if (deliveryAmount || hasProducts) {
                promises.push(addTransaction({
                    client_id: clientId,
                    type: 'DELIVERY',
                    shift: shift,
                    amount: Number(deliveryAmount || 0),
                    description: 'Venta rápida',
                    products: hasProducts ? productsToSave : undefined
                }));
            }

            if (paymentAmount) {
                promises.push(addTransaction({
                    client_id: clientId,
                    type: 'PAYMENT',
                    shift: shift,
                    amount: Number(paymentAmount),
                    description: 'Abono rápido'
                }));
            }

            await Promise.all(promises);

            // Reset
            setDeliveryAmount('');
            setPaymentAmount('');
            setClientId('');
            setSearchTerm('');
            setProductQuantities({});
            setFilteredClients(clients);
            onSuccess?.();

        } catch (err) {
            alert('Error al guardar: ' + err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md space-y-4 border border-gray-200">

            {/* Seeds */}
            {(clients.length === 0 || availableProducts.length === 0) && !loading && (
                <div className="space-y-2">
                    {clients.length === 0 && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                            <button type="button" onClick={handleSeedClients} className="text-sm font-bold text-yellow-800 underline">
                                ⚠️ Cargar Clientes
                            </button>
                        </div>
                    )}
                    {availableProducts.length === 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                            <button type="button" onClick={handleSeedProducts} className="text-sm font-bold text-blue-800 underline">
                                📦 Cargar Productos y Precios
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Voice Button */}
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg'
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                        }`}
                >
                    {isListening ? '🛑 Escuchando...' : '🎤 Dictar Pedido'}
                </button>
            </div>

            {/* Client Search */}
            <div className="relative" ref={searchRef}>
                <label className="block text-sm font-bold text-gray-700 mb-1">Buscar Cliente</label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                        setClientId('');
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Escribe nombre o número..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-lg"
                    disabled={clients.length === 0}
                />

                {showDropdown && clients.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 max-h-60 overflow-y-auto rounded-lg shadow-xl">
                        {filteredClients.length > 0 ? (
                            filteredClients.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => selectClient(c)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-black text-lg"
                                >
                                    <span className="font-bold mr-2">{c.order_index}.</span>
                                    {c.name}
                                </div>
                            ))
                        ) : (
                            <div className="p-3 text-gray-500">No encontrado</div>
                        )}
                    </div>
                )}
            </div>

            {/* Debt Display & Edit */}
            {clientId && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-red-600 font-bold uppercase">Deuda Total</p>
                        <p className="text-2xl font-black text-red-700">
                            S/ {currentDebt === null ? '...' : currentDebt.toFixed(2)}
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleEditDebt}
                            className="text-sm bg-white border border-red-200 text-red-600 px-3 py-1 rounded shadow-sm hover:bg-red-50"
                        >
                            ⚙️ Ajustar
                        </button>
                    )}
                </div>
            )}

            {/* Turno */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button type="button" onClick={() => setShift('MORNING')} className={`flex-1 py-1 rounded ${shift === 'MORNING' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Mañana</button>
                    <button type="button" onClick={() => setShift('AFTERNOON')} className={`flex-1 py-1 rounded ${shift === 'AFTERNOON' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Tarde</button>
                </div>
            </div>

            {/* Products Selection */}
            {availableProducts.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Productos</label>
                    <div className="grid grid-cols-2 gap-2">
                        {availableProducts.map(prod => {
                            const isSelected = productQuantities[prod.name] !== undefined;
                            return (
                                <div key={prod.id} className={`relative flex items-center p-1 rounded-lg border transition-all ${isSelected ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-gray-100 border-gray-200 hover:border-gray-300'}`}>
                                    {/* Toggle Area */}
                                    <div
                                        onClick={() => toggleProduct(prod.name)}
                                        className={`flex-1 px-2 py-2 cursor-pointer text-sm font-bold select-none ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}
                                    >
                                        {prod.name} <span className="text-[10px] text-gray-400 block font-normal">S/ {prod.price.toFixed(2)}</span>
                                    </div>

                                    {/* Input Area */}
                                    {isSelected && (
                                        <input
                                            type="number"
                                            autoFocus
                                            value={productQuantities[prod.name]}
                                            onChange={(e) => handleProductQtyChange(prod.name, e.target.value)}
                                            className="w-16 p-1 mr-1 text-center font-bold border-l border-gray-100 focus:outline-none text-blue-800 bg-transparent"
                                            placeholder="#"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <div className="w-1/2">
                    <label className="block text-sm font-bold text-blue-700 mb-1">ENTREGADO (S/)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={deliveryAmount}
                        onChange={(e) => setDeliveryAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-3 border-2 border-blue-100 focus:border-blue-500 rounded-lg font-mono text-xl font-bold text-black bg-blue-50"
                        readOnly={Object.keys(productQuantities).length > 0} // Read only if auto-calculating
                    />
                </div>

                <div className="w-1/2">
                    <label className="block text-sm font-bold text-green-700 mb-1">PAGADO (S/)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-3 border-2 border-green-100 focus:border-green-500 rounded-lg font-mono text-xl font-bold text-black"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !clientId}
                className={`w-full py-4 rounded-lg font-bold text-white text-lg shadow-lg active:scale-95 transition-transform ${loading || !clientId ? 'bg-gray-400' : 'bg-gray-900 hover:bg-black'
                    }`}
            >
                {loading ? 'Guardando...' : 'GUARDAR MOVIMIENTO'}
            </button>

        </form>
    );
}
