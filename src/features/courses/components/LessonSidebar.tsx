import { Lesson } from '../services/coursesService';

interface LessonSidebarProps {
    lessons: Lesson[];
    activeLessonId?: string;
    completedLessonIds?: string[];
    onSelectLesson: (lesson: Lesson) => void;
}

export function LessonSidebar({ lessons, activeLessonId, completedLessonIds = [], onSelectLesson }: LessonSidebarProps) {
    // Group lessons by section
    const sections = lessons.reduce((acc, lesson) => {
        const section = lesson.section || 'Módulo 1';
        if (!acc[section]) acc[section] = [];
        acc[section].push(lesson);
        return acc;
    }, {} as Record<string, Lesson[]>);

    return (
        <div className="bg-zgas-navy-light border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="text-lg font-bold text-white">Contenido del Curso</h3>
                <p className="text-xs text-white/40 mt-1">
                    {completedLessonIds.length} / {lessons.length} lecciones completadas
                </p>
                {/* Progress Bar */}
                <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div
                        className="h-full bg-zgas-lime transition-all duration-300"
                        style={{ width: `${(completedLessonIds.length / Math.max(lessons.length, 1)) * 100}%` }}
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-4">
                {Object.entries(sections).map(([sectionName, sectionLessons]) => (
                    <div key={sectionName}>
                        <h4 className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                            {sectionName}
                        </h4>
                        <div className="space-y-1">
                            {sectionLessons.map((lesson, idx) => {
                                const isActive = lesson.id === activeLessonId;
                                const isCompleted = completedLessonIds.includes(lesson.id);

                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => onSelectLesson(lesson)}
                                        className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-start gap-3 group
                                            ${isActive
                                                ? 'bg-zgas-lime/10 border border-zgas-lime/20'
                                                : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                                            }
                                        `}
                                    >
                                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border text-[10px] shrink-0 transition-colors
                                            ${isCompleted
                                                ? 'bg-zgas-lime border-zgas-lime text-zgas-navy'
                                                : isActive
                                                    ? 'border-zgas-lime text-zgas-lime'
                                                    : 'border-white/20 text-white/40 group-hover:border-white/40'
                                            }
                                        `}>
                                            {isCompleted ? (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <span>{lesson.order_index + 1}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                                                {lesson.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-white/30 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    {lesson.duration > 0 ? `${lesson.duration} min` : 'Video'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
