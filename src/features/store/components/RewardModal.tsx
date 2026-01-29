'use client';

import { useState, useEffect } from 'react';
import { RewardInput, storeService } from '../services/storeService';
import { ImageUploadInput } from '@/shared/components/ImageUploadInput';

interface RewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If present, it's edit mode
}

export function RewardModal({ isOpen, onClose, onSuccess, initialData }: RewardModalProps) {
    const [formData, setFormData] = useState<RewardInput>({
        title: '',
        description: '',
        cost: 0,
        image_url: '',
        stock: -1
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description,
                cost: initialData.cost,
                image_url: initialData.image_url,
                stock: initialData.stock
            });
        } else {
            setFormData({
                title: '',
                description: '',
                cost: 0,
                image_url: '',
                stock: -1
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form with data:', formData);

        // Manual validation
        if (!formData.title) return alert('Por favor ingresa un título');
        if (!formData.description) return alert('Por favor ingresa una descripción');
        if (formData.cost < 0) return alert('El costo no puede ser negativo');

        setLoading(true);
        try {
            if (initialData) {
                await storeService.updateReward(initialData.id, formData);
            } else {
                await storeService.createReward(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar el premio: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !confirm('¿Estás seguro de borrar este premio?')) return;
        setLoading(true);
        try {
            await storeService.deleteReward(initialData.id);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al eliminar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={onClose}
        >
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="bg-zgas-navy border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">
                            {initialData ? 'Editar Premio' : 'Nuevo Premio'}
                        </h3>
                        <button onClick={onClose} className="text-white/40 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <ImageUploadInput
                            value={formData.image_url}
                            onChange={(url) => setFormData({ ...formData, image_url: url })}
                            folder="rewards"
                        />

                        <div>
                            <label htmlFor="title" className="block text-sm text-white/60 mb-1">Título</label>
                            <input
                                id="title"
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-zgas-lime outline-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm text-white/60 mb-1">Descripción</label>
                            <textarea
                                id="description"
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-zgas-lime outline-none h-24"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="cost" className="block text-sm text-white/60 mb-1">Costo (Puntos)</label>
                                <input
                                    id="cost"
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.cost}
                                    onChange={e => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-zgas-lime outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="stock" className="block text-sm text-white/60 mb-1">Stock (-1 = Infinito)</label>
                                <input
                                    id="stock"
                                    type="number"
                                    required
                                    value={formData.stock}
                                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-zgas-lime outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            {initialData && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                >
                                    Eliminar
                                </button>
                            )}
                            <div className="flex-1"></div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-white/60 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={(e) => handleSubmit(e as any)}
                                disabled={loading}
                                className="px-6 py-2 rounded-lg bg-zgas-lime text-zgas-navy font-bold hover:bg-zgas-lime/90 transition-colors"
                            >
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
