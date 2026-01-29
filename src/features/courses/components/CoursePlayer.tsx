'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Lesson, coursesService } from '../services/coursesService';
import { LessonSidebar } from './LessonSidebar';

interface CoursePlayerProps {
    course: any; // Using any for simplicity in transformation, ideally typed
    initialProgress: any;
    user: any;
}

export function CoursePlayer({ course, initialProgress, user }: CoursePlayerProps) {
    const router = useRouter();

    // Sort lessons just in case
    const lessons: Lesson[] = course.lessons || [];

    // State
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(lessons[0] || null);
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialProgress?.completed_lessons || []);
    const [loading, setLoading] = useState(false);

    // Timer State
    const [timeLeft, setTimeLeft] = useState(0);
    const [canComplete, setCanComplete] = useState(false);

    // Effect to reset timer on lesson change
    useEffect(() => {
        if (!activeLesson) return;

        const isCompleted = completedLessonIds.includes(activeLesson.id);
        if (isCompleted) {
            setCanComplete(true);
            setTimeLeft(0);
            return;
        }

        // If duration is set, start countdown
        const currentLessonDuration = activeLesson.duration || 0; // Ensure number
        if (currentLessonDuration > 0) {
            setCanComplete(false);
            setTimeLeft(currentLessonDuration * 60); // minutes to seconds
        } else {
            // If no duration set, allow immediate
            setCanComplete(true);
            setTimeLeft(0);
        }
    }, [activeLesson, completedLessonIds]);

    // Countdown Effect
    useEffect(() => {
        if (timeLeft <= 0 || canComplete) {
            if (timeLeft <= 0 && !canComplete) setCanComplete(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setCanComplete(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, canComplete]);

    // Format time helper
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleVideoEnded = () => {
        setCanComplete(true);
        setTimeLeft(0);
    };

    // Effect to set active lesson based on history if available
    useEffect(() => {
        if (initialProgress?.last_lesson_id) {
            const last = lessons.find(l => l.id === initialProgress.last_lesson_id);
            if (last) setActiveLesson(last);
        }
    }, []);

    const handleCompleteLesson = async () => {
        if (!activeLesson || loading) return;

        // If already completed, just skip
        if (completedLessonIds.includes(activeLesson.id)) return;

        setLoading(true);
        try {
            const res: any = await coursesService.completeLesson(course.id, activeLesson.id);

            if (res && res[0]?.success) {
                // Update local state
                setCompletedLessonIds(prev => [...prev, activeLesson.id]);

                // If course completed (flag from DB or calc locally)
                if (res[0].course_completed) {
                    confetti({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                    alert(`¡Felicidades! Has completado el curso "${course.title}" y ganado ${course.points_reward} puntos.`);
                }

                // Autoplay next lesson?
                const currentIndex = lessons.findIndex(l => l.id === activeLesson.id);
                if (currentIndex < lessons.length - 1) {
                    // Optional: Auto move to next
                    // setActiveLesson(lessons[currentIndex + 1]);
                }

                router.refresh(); // Sync server state
            }
        } catch (error) {
            console.error('Error completing lesson:', error);
            alert('Error al guardar progreso.');
        } finally {
            setLoading(false);
        }
    };

    if (!activeLesson) {
        return <div className="p-10 text-center text-white/50">Este curso no tiene lecciones publicadas.</div>;
    }

    const isLessonCompleted = completedLessonIds.includes(activeLesson.id);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Main Content: Video & Actions */}
            <div className="lg:col-span-2 space-y-6">
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                    {activeLesson.video_url ? (
                        activeLesson.video_url.includes('youtube.com') || activeLesson.video_url.includes('youtu.be') ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={(() => {
                                    const url = activeLesson.video_url || '';
                                    let videoId = '';
                                    if (url.includes('youtu.be')) {
                                        videoId = url.split('youtu.be/')[1]?.split('?')[0];
                                    } else if (url.includes('watch?v=')) {
                                        videoId = url.split('watch?v=')[1]?.split('&')[0];
                                    } else {
                                        // Fallback/Already embed format
                                        return url;
                                    }
                                    return `https://www.youtube.com/embed/${videoId}`;
                                })()}
                                title={activeLesson.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <video
                                key={activeLesson.video_url} // Key forces reload on change
                                src={activeLesson.video_url}
                                controls
                                className="w-full h-full"
                                controlsList="nodownload"
                                onEnded={handleVideoEnded}
                            />
                        )
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-white/40 bg-white/5">
                            <span className="text-4xl mb-4">📺</span>
                            <span>Selecciona una lección para ver el video</span>
                        </div>
                    )}
                </div>

                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{activeLesson.title}</h2>
                        <p className="text-white/50 text-sm">Lección {activeLesson.order_index + 1} de {lessons.length}</p>
                    </div>

                    <button
                        onClick={handleCompleteLesson}
                        disabled={!canComplete || loading}
                        className={`
                            px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg min-w-[200px] justify-center
                            ${!canComplete && !loading
                                ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                                : isLessonCompleted
                                    ? 'bg-white/10 text-white/40 cursor-default border border-white/5'
                                    : 'bg-zgas-lime text-zgas-navy hover:bg-white hover:scale-105'
                            }
                        `}
                    >
                        {loading ? 'Guardando...' : isLessonCompleted ? (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Completada
                            </>
                        ) : !canComplete ? (
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Espera {formatTime(timeLeft)}
                            </span>
                        ) : (
                            <>
                                <span>Marcar como Vista</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </>
                        )}
                    </button>
                </div>

                {/* Description */}
                {activeLesson.description && (
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-white font-bold mb-2">Acerca de esta lección</h3>
                        <p className="text-white/70 leading-relaxed">{activeLesson.description}</p>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div>
                <LessonSidebar
                    lessons={lessons}
                    activeLessonId={activeLesson.id}
                    completedLessonIds={completedLessonIds}
                    onSelectLesson={setActiveLesson}
                />
            </div>
        </div>
    );
}
