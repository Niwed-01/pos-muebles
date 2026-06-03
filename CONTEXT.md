# CONTEXT.md — Lee esto antes de generar cualquier código

## Stack FIJO (no cambiar nunca)
- Frontend: Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui
- Backend: Next.js API Routes (mismo proyecto, no backend separado)
- BD: Docker (PostgreSQL) + Prisma ORM
- Auth: NextAuth.js v5
- Estado: Zustand
- Fetching: TanStack Query (React Query)
- PDF: react-pdf
- Tablas: TanStack Table
- Forms: React Hook Form + Zod

## Estructura de carpetas FIJA
/app
  /api          → rutas de API (Next.js)
  /(auth)       → login, registro
  /(dashboard)  → todas las páginas autenticadas
/components
  /ui           → shadcn (no tocar)
  /shared       → componentes reutilizables propios
/lib
  /db.ts        → cliente Prisma (singleton)
  /auth.ts      → config NextAuth
  /utils.ts     → funciones helper
/prisma
  schema.prisma → esquema de BD

## Convenciones FIJAS
- Nombres de archivos: kebab-case
- Componentes: PascalCase
- API routes: /api/[recurso]/route.ts
- Siempre usar 'use client' solo cuando sea necesario
- Manejo de errores: try/catch en todas las API routes
- Respuesta API siempre: { data, error, message }
