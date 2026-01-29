
interface CourseCardProps {
    title: string;
    description: string;
    points: number;
    progress: number;
    image: string;
    isNew?: boolean;
}

export function CourseCard({ title, description, points, progress, image, isNew }: CourseCardProps) {
    return (
        <div className="group relative bg-[#00224a] border border-white/5 rounded-2xl overflow-hidden hover:border-zgas-lime/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col h-full">
            {/* Is New Badge */}
            {isNew && (
                <div className="absolute top-3 right-3 z-10 bg-zgas-lime text-zgas-navy text-xs font-bold px-2.5 py-1 rounded-md shadow-lg">
                    NUEVO
                </div>
            )}

            {/* Cover Image */}
            <div className="relative h-48 w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#00224a] to-transparent z-10 opacity-80" />
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0"
                />
                {/* Play Overlay */}
                <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="bg-zgas-lime text-zgas-navy rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-[0_0_20px_rgba(196,214,0,0.5)]">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-zgas-sapphire bg-zgas-sapphire/10 px-2 py-1 rounded">SST Básico</span>
                    <div className="flex items-center gap-1 text-zgas-lime">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                        <span className="text-xs font-bold">+{points} pts</span>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-zgas-lime transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-white/50 mb-6 line-clamp-2">
                    {description}
                </p>

                {/* Footer & Progress */}
                <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span>Progreso</span>
                        <span>{progress}%</span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-zgas-lime shadow-[0_0_10px_rgba(196,214,0,0.5)] transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
