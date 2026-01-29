import { createClient } from '@/lib/supabase/client';

export interface Post {
    id: string;
    content: string;
    image_url?: string;
    link_url?: string;
    likes_count: number;
    has_liked?: boolean;
    created_at: string;
    author: {
        full_name: string;
        avatar_url: string;
    };
}

export const communityService = {
    async getPosts(): Promise<Post[]> {
        const supabase = createClient();

        // Using a manual join approach since relations might not be auto-detected without proper setup
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch authors manually to be safe or assuming View
        // For now, let's try to fetch authors for these posts.
        // Ideally we would use: .select('*, profiles(full_name, avatar_url)')
        // But let's assume standard simple query first.

        const { data: postsWithAuthors, error: relationError } = await supabase
            .from('posts')
            .select(`
            *,
            profiles:user_id (
                full_name,
                avatar_url
            )
        `)
            .order('created_at', { ascending: false });

        if (relationError) {
            console.warn('Relation error in community:', relationError);
            return [];
        }

        return postsWithAuthors.map((p: any) => ({
            id: p.id,
            content: p.content,
            image_url: p.image_url,
            link_url: p.link_url,
            likes_count: p.likes_count,
            created_at: p.created_at,
            author: {
                full_name: p.profiles?.full_name || 'Usuario',
                avatar_url: p.profiles?.avatar_url
            }
        }));
    },

    async uploadImage(file: File): Promise<string> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = file.name.split('.').pop();
        const fileName = `community/${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    async createPost(content: string, imageUrl?: string, linkUrl?: string) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                content,
                image_url: imageUrl,
                link_url: linkUrl
            });

        if (error) throw error;
    },

    async deletePost(postId: string) {
        const supabase = createClient();
        await supabase.from('posts').delete().eq('id', postId);
    },

    async toggleLike(postId: string): Promise<{ liked: boolean; new_count: number }> {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('toggle_like', { p_post_id: postId });
        if (error) throw error;
        return data;
    }
};
