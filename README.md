# Sistema de Mantenimientos - Next.js + Supabase

Aplicación web para programar mantenimientos de equipos de cómputo.

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Date Picker**: react-day-picker + date-fns
- **Validación**: Zod
- **Despliegue**: Vercel

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa con tus credenciales de Supabase:

```bash
cp .env.example .env.local
```

Obtén las credenciales en: https://supabase.com/dashboard/project/_/settings/api

### 3. Ejecutar el script SQL en Supabase

Ejecuta el contenido de `supabase-schema.sql` en el **SQL Editor** de Supabase.

### 4. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
app/
├── actions.ts          # Server Actions para lógica de negocio
├── page.tsx            # Página principal con formulario
├── layout.tsx          # Layout raíz
├── globals.css         # Estilos globales + Tailwind
lib/
├── supabase.ts         # Cliente de Supabase (cliente y servidor)
supabase-schema.sql     # Esquema completo de base de datos
```

## Flujo de la Aplicación

1. **Usuario** ingresa sus datos y selecciona departamento
2. **Equipo** registra tipo, número de serie, marca/modelo
3. **Programación** selecciona fecha (solo días laborables futuros) y hora (8:00-17:00)
4. **Submit** ejecuta Server Action que:
   - Busca/crea usuario por nombre + email
   - Busca/crea equipo por número de serie
   - Crea cita de mantenimiento
   - Actualiza estado del equipo a "En Mantenimiento"

## Comandos Útiles

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run start    # Servidor producción
npm run lint     # Linter
```

## Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Agrega las variables de entorno en Project Settings > Environment Variables
3. Deploy automático en cada push a main