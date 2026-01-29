# PRP: Plataforma SST Z-Gas (Gamificada)

## 1. Visión General
Plataforma de capacitación en Seguridad y Salud en el Trabajo (SST) con enfoque gamificado, diseño de alto contraste y sistema anti-copia.

## 2. Identidad Visual (Ya Implementada)
- **Primary:** Navy Blue (`#002B5C`)
- **Accent:** Lime Green (`#C4D600`)
- **Interactive:** Sapphire Blue (`#0055A4`)
- **Fondo:** Gradiente (`#003366` -> `#001F3F`)
- **Tipografía:** Sans-serif Bold (Inter/Montserrat)

## 3. Arquitectura de Base de Datos (Supabase)

### `profiles` (Public)
Extiende la tabla `auth.users`.
- `id`: uuid (PK, FK auth.users)
- `full_name`: text
- `role`: text ('employee' | 'admin')
- `total_points`: integer (default: 0)
- `avatar_url`: text

### `courses`
Catálogo de capacitación.
- `id`: uuid (PK)
- `title`: text
- `description`: text
- `video_url`: text
- `cover_image`: text
- `points_reward`: integer (Puntos al completar)
- `duration_minutes`: integer

### `questions` (Quiz)
Preguntas asociadas a cursos.
- `id`: uuid
- `course_id`: uuid (FK)
- `question_text`: text
- `options`: jsonb (Array de opciones)
- `correct_option_index`: integer

### `user_progress`
Tracking de avance.
- `user_id`: uuid (FK)
- `course_id`: uuid (FK)
- `completed`: boolean
- `score`: integer (si aplica)
- `completed_at`: timestamp

### `rewards` (Tienda)
- `id`: uuid
- `title`: text
- `cost_points`: integer
- `image_url`: text

## 4. Funcionalidades Clave (Roadmap)

### Fase 1: Esqueleto y Auth (EN PROGRESO)
- [x] Configuración Tailwind Z-Gas
- [ ] Setup Supabase (Tablas `profiles`)
- [ ] Login (Email/Password)

### Fase 2: Dashboard y Cursos
- [ ] Layout (Sidebar + Header con Puntos)
- [ ] Grid de Cursos (Cards con barra de progreso Lime)
- [ ] Reproductor de Video (Modal)

### Fase 3: Gamificación
- [ ] Sistema de Quiz Aleatorio
- [ ] Lógica de asignación de Puntos
- [ ] Leaderboard Widget
- [ ] Tienda de Canje

## 5. Reglas de Negocio
- **Anti-Copia:** El examen tiene timer visible.
- **Puntos:** Solo se otorgan una vez por curso completado.
- **Feedback Visual:** Uso intensivo de Lime Green para éxito/progreso.
