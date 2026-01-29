'use client';

import { useState } from 'react';
import { communityService } from '../services/communityService';
import { useAuthStore } from '@/features/auth/store/authStore';

export function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
    const { user } = useAuthStore();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMedia, setShowMedia] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [linkUrl, setLinkUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !selectedFile) return;

        setLoading(true);
        try {
            let finalImageUrl = '';

            if (selectedFile) {
                finalImageUrl = await communityService.uploadImage(selectedFile);
            }

            await communityService.createPost(content, finalImageUrl || undefined, linkUrl || undefined);

            // Reset form
            setContent('');
            setSelectedFile(null);
            setFilePreview(null);
            setLinkUrl('');
            setShowMedia(false);
            onPostCreated();
        } catch (err) {
            console.error(err);
            alert('Error al publicar');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        }
    };

    return (
        <div className="bg-zgas-navy-light border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-zgas-lime flex items-center justify-center text-zgas-navy font-bold flex-shrink-0">
                    {user?.full_name?.charAt(0) || 'U'}
                </div>
                <form onSubmit={handleSubmit} className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="¿Qué quieres compartir con la comunidad?"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-zgas-lime transition-colors min-h-[100px] mb-4"
                    />

                    {showMedia && (
                        <div className="space-y-3 mb-4 animate-in fade-in slide-in-from-top-2">
                            {/* Image Upload */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <label className="block text-sm text-white/60 mb-2">Foto</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zgas-lime file:text-zgas-navy hover:file:bg-zgas-lime/90"
                                />
                                {filePreview && (
                                    <div className="mt-2 relative w-full h-32 bg-black/20 rounded-lg overflow-hidden">
                                        <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Video/Link Input */}
                            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <label className="block text-sm text-white/60 mb-2">Video / Enlace externo</label>
                                <input
                                    type="url"
                                    placeholder="https://youtube.com/..."
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-zgas-lime outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setShowMedia(!showMedia)}
                            className={`text-sm flex items-center gap-2 hover:text-white transition-colors ${showMedia ? 'text-zgas-lime' : 'text-white/60'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {showMedia ? 'Ocultar Multimedia' : 'Añadir Foto/Link'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !content.trim()}
                            className="bg-zgas-lime text-zgas-navy font-bold px-6 py-2 rounded-lg hover:bg-zgas-lime/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
