'use client';

import { Post, communityService } from '../services/communityService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useState } from 'react';

export function PostCard({ post, onDelete }: { post: Post; onDelete?: () => void }) {
    const { user } = useAuthStore();
    const isAuthor = user?.full_name === post.author.full_name;

    const [likes, setLikes] = useState(post.likes_count);
    const [hasLiked, setHasLiked] = useState(post.has_liked);
    const [likeLoading, setLikeLoading] = useState(false);

    const handleLike = async () => {
        if (likeLoading) return;
        setLikeLoading(true);
        try {
            // Optimistic update
            const newLiked = !hasLiked;
            setHasLiked(newLiked);
            setLikes(prev => newLiked ? prev + 1 : prev - 1);

            const result = await communityService.toggleLike(post.id);

            // Sync with server results safely
            setLikes(result.new_count);
            setHasLiked(result.liked);
        } catch (err) {
            console.error(err);
            // Revert on error
            setHasLiked(!hasLiked);
            setLikes(prev => hasLiked ? prev + 1 : prev - 1);
        } finally {
            setLikeLoading(false);
        }
    };

    return (
        <div className="bg-zgas-navy-light border border-white/5 rounded-xl p-6 mb-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-zgas-lime/20 flex items-center justify-center overflow-hidden">
                    {post.author.avatar_url ? (
                        <img src={post.author.avatar_url} alt={post.author.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-zgas-lime font-bold">{post.author.full_name.charAt(0)}</span>
                    )}
                </div>
                <div className="flex-1">
                    <div className="font-bold text-white text-sm">{post.author.full_name}</div>
                    <div className="text-white/40 text-xs">{new Date(post.created_at).toLocaleDateString()}</div>
                </div>
                {isAuthor && (
                    <button onClick={onDelete} className="text-white/20 hover:text-red-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="text-white/90 mb-4 whitespace-pre-wrap">{post.content}</div>

            {/* Media */}
            {post.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden border border-white/5">
                    <img src={post.image_url} alt="Post attachment" className="w-full max-h-96 object-cover" />
                </div>
            )}

            {/* Link Preview (Simple) */}
            {post.link_url && (
                <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="block p-3 bg-white/5 rounded-lg border-l-4 border-zgas-lime hover:bg-white/10 transition-colors mb-4">
                    <div className="flex items-center gap-2 text-zgas-lime text-sm font-medium mb-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        Enlace Adjunto
                    </div>
                    <div className="text-white/60 text-xs truncate">{post.link_url}</div>
                </a>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 border-t border-white/5 pt-4">
                <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-2 transition-colors text-sm font-medium ${hasLiked ? 'text-red-500' : 'text-white/40 hover:text-white'}`}
                >
                    <svg className={`w-5 h-5 ${hasLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {likes} Likes
                </button>
            </div>
        </div>
    );
}
