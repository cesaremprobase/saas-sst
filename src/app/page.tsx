import { Sidebar } from '@/features/layout/Sidebar';
import { Header } from '@/features/layout/Header';
import { CourseGrid } from '@/features/courses/components/CourseGrid';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient(); // Ensure await here
  const { data: { user } } = await supabase.auth.getUser();

  // Get Courses
  const { data: courses } = await supabase.from('courses').select('*').order('created_at', { ascending: false });

  // Get User Role (if logged in)
  let userRole = 'user';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile) userRole = profile.role;
  }

  // Fallback if DB is empty or not connected
  const displayCourses = courses?.length ? courses : [
    {
      id: 'demo-1',
      title: "Fundamentos de Seguridad Industrial (Demo)",
      description: "Conecta Supabase para ver los cursos reales.",
      points_reward: 150,
      image_url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2670&auto=format&fit=crop",
      is_new: true
    },
    {
      id: 'demo-2',
      title: "Activación Requerida",
      description: "Ejecuta el script SQL en Supabase para ver más cursos.",
      points_reward: 0,
      image_url: "https://images.unsplash.com/photo-1582148453488-84ddfb824a74?q=80&w=2670&auto=format&fit=crop",
      is_new: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003366] to-[#001F3F] text-white selection:bg-zgas-lime selection:text-zgas-navy">
      <Sidebar />

      <main className="md:pl-64 flex flex-col min-h-screen">
        <Header />

        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">

          {/* Sección Hero / Welcome */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Zona de Entrenamiento
              </h2>
              <p className="text-white/60">
                Mejora tus habilidades y gana puntos para la tienda Z-Gas.
              </p>
            </div>

            {/* Filter Tabs (Visual only) */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
              <button className="px-4 py-1.5 rounded-md bg-white/10 text-white font-medium text-sm">Todos</button>
              <button className="px-4 py-1.5 rounded-md hover:bg-white/5 text-white/60 text-sm transition-colors">En Curso</button>
              <button className="px-4 py-1.5 rounded-md hover:bg-white/5 text-white/60 text-sm transition-colors">Completados</button>
            </div>
          </div>

          {/* Grid de Cursos (Client Component) */}
          <CourseGrid
            initialCourses={displayCourses}
            userRole={userRole}
          />
        </div>

      </main>
    </div>
  );
}
