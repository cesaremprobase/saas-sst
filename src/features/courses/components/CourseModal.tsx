'use client';

import { useState, useEffect } from 'react';
import { CourseInput, coursesService } from '../services/coursesService';
import { ImageUploadInput } from '@/shared/components/ImageUploadInput';

interface CourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If present, it's edit mode
}

export function CourseModal({ isOpen, onClose, onSuccess, initialData }: CourseModalProps) {
    const [formData, setFormData] = useState<CourseInput>({
        title: '',
        description: '',
        points_reward: 100,
        image_url: '',
        video_url: '',
        is_new: true
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description,
                points_reward: initialData.points_reward || initialData.points,
                image_url: initialData.image_url || initialData.image,
                video_url: initialData.video_url || '',
                is_new: initialData.is_new
            });
        } else {
            setFormData({
                title: '',
                description: '',
                points_reward: 100,
                image_url: '',
                video_url: '',
                is_new: true
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting Course form with data:', formData);

        // Manual Validation
        if (!formData.title) return alert('Por favor ingresa un título');
        if (!formData.description) return alert('Por favor ingresa una descripción');
        if (formData.points_reward < 0) return alert('Los puntos no pueden ser negativos');

        setLoading(true);
        try {
            if (initialData) {
                await coursesService.updateCourse(initialData.id, formData);
            } else {
                await coursesService.createCourse(formData);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar el curso: ' + (error as any).message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialData || !confirm('¿Estás seguro de borrar este curso?')) return;
        setLoading(true);
        try {
            await coursesService.deleteCourse(initialData.id);
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
                            {initialData ? 'Editar Curso' : 'Nuevo Curso'}
                        </h3>
                        <button onClick={onClose} className="text-white/40 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <ImageUploadInput
                            value={formData.image_url}
                            onChange={(url) => setFormData({ ...formData, image_url: url })}
                            folder="courses"
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

                        <div>
                            <label htmlFor="video_url" className="block text-sm text-white/60 mb-1">Video URL (YouTube o Directo)</label>
                            <input
                                id="video_url"
                                type="text"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={formData.video_url || ''}
                                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-zgas-lime outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="points" className="block text-sm text-white/60 mb-1">Puntos Recompensa</label>
                                <input
                                    id="points"
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.points_reward}
                                    onChange={e => setFormData({ ...formData, points_reward: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-zgas-lime outline-none"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label htmlFor="is_new" className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        id="is_new"
                                        type="checkbox"
                                        checked={formData.is_new}
                                        onChange={e => setFormData({ ...formData, is_new: e.target.checked })}
                                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-zgas-lime focus:ring-0"
                                    />
                                    <span className="text-sm text-white">¿Es Nuevo?</span>
                                </label>
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
