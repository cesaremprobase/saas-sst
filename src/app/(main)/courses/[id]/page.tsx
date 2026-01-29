import { createClient } from '@/lib/supabase/server';
import { BackButton } from '@/shared/components/BackButton';
import { CoursePlayer } from '@/features/courses/components/CoursePlayer';
import { redirect } from 'next/navigation';

export default async function CoursePage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    const { id } = await params;

    const { data: course, error } = await supabase
        .from('courses')
        .select('*, lessons(*)')
        .eq('id', id)
        .single();

    if (error || !course) {
        return <div className="p-10 text-white text-center">Curso no encontrado</div>;
    }

    // Sort lessons server-side
    if (course.lessons) {
        course.lessons.sort((a: any, b: any) => a.order_index - b.order_index);
    }

    const { data: progress } = await supabase
        .from('user_progress')
        .select('*') // Get full record including completed_lessons
        .eq('course_id', id)
        .eq('user_id', user.id)
        .single();

    // Check if admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin';

    // Import dynamically or use standard import if server component handles it well (LessonManager is client)
    const { LessonManager } = await import('@/features/courses/components/LessonManager');

    return (
        <div className="p-6 md:p-10 max-w-[1600px] mx-auto w-full min-h-screen">
            <BackButton />

            <div className="mt-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-zgas-sapphire bg-zgas-sapphire/10 px-2 py-1 rounded">Curso Oficial</span>
                        <span className="text-zgas-lime text-sm font-bold">+{course.points_reward} pts</span>
                    </div>
                </div>
            </div>

            <CoursePlayer
                course={course}
                initialProgress={progress}
                user={user}
            />

            {isAdmin && (
                <div className="mt-12 border-t border-white/10 pt-10">
                    <h2 className="text-2xl font-bold text-white mb-6">Administración del Curso</h2>
                    <LessonManager
                        courseId={course.id}
                        initialLessons={course.lessons || []}
                    />
                </div>
            )}
        </div>
    );
}
