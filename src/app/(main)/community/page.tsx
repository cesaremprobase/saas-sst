'use client';

import { useAuthStore } from '@/features/auth/store/authStore';
import { BackButton } from '@/shared/components/BackButton';
import { CreatePostForm } from '@/features/community/components/CreatePostForm';
import { PostCard } from '@/features/community/components/PostCard';
import { communityService, Post } from '@/features/community/services/communityService';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function CommunityPage() {
    const { user } = useAuthStore();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadPosts = useCallback(async () => {
        try {
            const data = await communityService.getPosts();
            setPosts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handleDelete = async (postId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;
        await communityService.deletePost(postId);
        loadPosts();
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
            <BackButton />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Comunidad SST</h1>
                <p className="text-white/60">Comparte conocimientos, lecciones aprendidas y fotos con tus colegas.</p>
            </div>

            <CreatePostForm onPostCreated={loadPosts} />

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-white/40 animate-pulse">Cargando comunidad...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 text-white/40 bg-white/5 rounded-xl border border-dashed border-white/10">
                        Sé el primero en publicar algo hoy.
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard key={post.id} post={post} onDelete={() => handleDelete(post.id)} />
                    ))
                )}
            </div>
        </div>
    );
}
