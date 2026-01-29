import { createClient } from '@/lib/supabase/client';

export interface CourseInput {
    title: string;
    description: string;
    points_reward: number;
    image_url?: string;
    video_url?: string;
    is_new?: boolean;
}

export interface Lesson {
    id: string;
    course_id: string;
    title: string;
    description?: string;
    video_url?: string;
    section: string;
    order_index: number;
    duration: number;
    is_published: boolean;
}

export interface CourseWithLessons extends CourseInput {
    id: string;
    lessons?: Lesson[];
}

export const coursesService = {
    async getCourses() {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('courses')
            .select('*, lessons(*)');
        if (error) throw error;
        return data as CourseWithLessons[];
    },

    async getCourseById(id: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                lessons (
                    *
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        // Sort lessons by order_index
        if (data && data.lessons) {
            data.lessons.sort((a: Lesson, b: Lesson) => a.order_index - b.order_index);
        }
        return data as CourseWithLessons;
    },

    async createCourse(data: CourseInput) {
        const supabase = createClient();
        const { error } = await supabase
            .from('courses')
            .insert(data);
        if (error) throw error;
    },

    async updateCourse(id: string, data: CourseInput) {
        const supabase = createClient();
        const { error } = await supabase
            .from('courses')
            .update(data)
            .eq('id', id);
        if (error) throw error;
    },

    async deleteCourse(id: string) {
        const supabase = createClient();
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // Lesson Management
    async createLesson(data: Omit<Lesson, 'id' | 'created_at'>) {
        const supabase = createClient();
        const { error } = await supabase
            .from('lessons')
            .insert(data);
        if (error) throw error;
    },

    async completeLesson(courseId: string, lessonId: string) {
        const supabase = createClient();
        const { data, error } = await supabase
            .rpc('complete_lesson', {
                p_course_id: courseId,
                p_lesson_id: lessonId,
                p_user_id: (await supabase.auth.getUser()).data.user?.id
            });
        if (error) throw error;
        return data;
    }
};
