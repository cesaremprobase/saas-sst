'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CourseCard } from './CourseCard';
import { CourseModal } from './CourseModal';

interface Course {
    id: string;
    title: string;
    description: string;
    points_reward: number;
    image_url: string;
    is_new: boolean;
    progress?: number;
}

interface CourseGridProps {
    initialCourses: Course[];
    userRole: string;
}

export function CourseGrid({ initialCourses, userRole }: CourseGridProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const router = useRouter();

    const handleCreate = () => {
        setEditingCourse(null);
        setIsModalOpen(true);
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        router.refresh();
    };

    return (
        <>
            {userRole === 'admin' && (
                <div className="mb-6">
                    <button
                        onClick={handleCreate}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Administrar: Crear Curso
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialCourses.map((course, idx) => (
                    <div key={course.id || idx} className="relative group">
                        {userRole === 'admin' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(course); }}
                                className="absolute top-2 left-2 z-20 bg-black/60 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors border border-white/20 shadow-lg"
                                title="Editar Curso"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                        )}
                        <Link href={`/courses/${course.id}`} className="block h-full">
                            <CourseCard
                                title={course.title}
                                description={course.description}
                                points={course.points_reward}
                                progress={course.progress || 0}
                                image={course.image_url}
                                isNew={course.is_new}
                            />
                        </Link>
                    </div>
                ))}

                {/* Card "Coming Soon" - Static */}
                <div className="border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-10 text-center gap-4 group cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all min-h-[400px]">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                    </div>
                    <div>
                        <h3 className="text-white font-bold mb-1">Próximamente</h3>
                        <p className="text-sm text-white/40">Nuevos cursos cada mes</p>
                    </div>
                </div>
            </div>

            <CourseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                initialData={editingCourse}
            />
        </>
    );
}
