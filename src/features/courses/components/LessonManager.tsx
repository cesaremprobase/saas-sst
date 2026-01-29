'use client';

import { useState } from 'react';
import { Lesson, coursesService } from '../services/coursesService';
import { useRouter } from 'next/navigation';

interface LessonManagerProps {
    courseId: string;
    initialLessons: Lesson[];
}

export function LessonManager({ courseId, initialLessons }: LessonManagerProps) {
    const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({
        section: 'Módulo 1',
        is_published: true
    });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSaveLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await coursesService.createLesson({
                ...currentLesson,
                course_id: courseId,
                order_index: lessons.length, // auto append
                duration: currentLesson.duration || 0,
                // Default values if needed
                title: currentLesson.title || 'Nueva Lección',
                section: currentLesson.section || 'Módulo 1',
                is_published: true
            } as any);

            alert('Lección creada correctamente');
            router.refresh();
            setIsEditing(false);
            setCurrentLesson({ section: 'Módulo 1', is_published: true });
        } catch (error) {
            console.error(error);
            alert('Error al crear la lección');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zgas-navy-light border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Contenido del Curso</h2>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-zgas-lime text-zgas-navy px-4 py-2 rounded-lg font-bold hover:bg-white transition-colors"
                >
                    {isEditing ? 'Cancelar' : '+ Agregar Lección'}
                </button>
            </div>

            {isEditing && (
                <form onSubmit={handleSaveLesson} className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Título de la Lección</label>
                        <input
                            required
                            type="text"
                            value={currentLesson.title || ''}
                            onChange={e => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Sección / Módulo</label>
                            <input
                                type="text"
                                list="sections"
                                value={currentLesson.section || ''}
                                onChange={e => setCurrentLesson({ ...currentLesson, section: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                            />
                            <datalist id="sections">
                                <option value="Módulo 1" />
                                <option value="Módulo 2" />
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Duración (min)</label>
                            <input
                                type="number"
                                value={currentLesson.duration || 0}
                                onChange={e => setCurrentLesson({ ...currentLesson, duration: parseInt(e.target.value) || 0 })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Video URL (YouTube/MP4)</label>
                        <input
                            type="text"
                            value={currentLesson.video_url || ''}
                            onChange={e => setCurrentLesson({ ...currentLesson, video_url: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-1">Descripción</label>
                        <textarea
                            value={currentLesson.description || ''}
                            onChange={e => setCurrentLesson({ ...currentLesson, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white h-20"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white/10 hover:bg-zgas-lime hover:text-zgas-navy text-white font-bold py-2 rounded-lg transition-colors"
                    >
                        {loading ? 'Guardando...' : 'Guardar Lección'}
                    </button>
                </form>
            )}

            <div className="space-y-2">
                {lessons.length === 0 ? (
                    <div className="text-center py-10 text-white/40">
                        No hay lecciones en este curso. ¡Agrega la primera!
                    </div>
                ) : (
                    lessons.map((lesson) => (
                        <div key={lesson.id} className="p-4 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center group">
                            <div>
                                <span className="text-xs text-zgas-lime font-mono uppercase mr-2">{lesson.section}</span>
                                <span className="text-white font-medium">{lesson.title}</span>
                            </div>
                            <div className="text-sm text-white/40">
                                {lesson.duration} min
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
