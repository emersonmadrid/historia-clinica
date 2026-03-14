# Historia Clínica — Sistema de Gestión de Salud

Sistema web completo para gestión de historias clínicas, pacientes, citas y consultas médicas. Construido para consultorios y clínicas de cualquier especialidad.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)

## Funcionalidades

- **Pacientes** — Registro completo, búsqueda, historial de visitas
- **Historia Clínica** — Formato SOAP, signos vitales, diagnósticos CIE-10
- **Alergias y Antecedentes** — Registro médico por paciente
- **Citas** — Calendario mensual, recordatorios por email, confirmación RSVP
- **Usuarios y Roles** — ADMIN, DOCTOR, NURSE, RECEPTIONIST
- **Reportes** — Gráficos de consultas, citas y pacientes
- **Exportación PDF** — Historia clínica completa
- **Google Calendar** — Sincronización de citas
- **Configuración** — Datos de la organización/clínica

## Stack Tecnológico

- **Frontend/Backend:** Next.js 16 (App Router) + TypeScript
- **Base de datos:** PostgreSQL + Prisma 5
- **Autenticación:** Auth.js v5 (next-auth@beta)
- **UI:** Radix UI + Tailwind CSS v4
- **Tests:** Playwright (87 tests E2E)

## Requisitos

- Node.js 18+
- Docker y Docker Compose (para la base de datos)
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/emersonmadrid/historia-clinica.git
cd historia-clinica
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y completa los valores. Como mínimo necesitas `DATABASE_URL`, `DIRECT_URL` y `AUTH_SECRET`.

Para generar `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Levantar la base de datos

```bash
docker-compose up -d
```

### 5. Crear tablas y cargar datos de prueba

```bash
npx prisma migrate dev
npx ts-node prisma/seed.ts
```

### 6. Iniciar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Credenciales de prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@clinica.com | admin1234 |
| Doctor | doctor@clinica.com | demo1234 |
| Enfermera | enfermera@clinica.com | demo1234 |

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run test         # Tests E2E con Playwright
npx prisma studio    # Panel visual de la base de datos
npx prisma migrate dev  # Aplicar migraciones
npx ts-node prisma/seed.ts  # Cargar datos de prueba
```

## Estructura del proyecto

```
src/
├── app/                    # Páginas y API routes (Next.js App Router)
│   ├── (auth)/             # Login
│   ├── (dashboard)/        # Páginas principales
│   └── api/                # API REST
├── components/             # Componentes reutilizables
├── features/               # Lógica por dominio (patients, appointments, etc.)
├── lib/                    # Utilidades (auth, prisma, errors, permissions)
└── hooks/                  # React hooks
prisma/
├── schema.prisma           # Modelos de base de datos
├── migrations/             # Historial de migraciones
└── seed.ts                 # Datos de prueba
tests/
└── ui.spec.ts              # 87 tests E2E con Playwright
```

## Licencia

Propietario — Todos los derechos reservados © 2026 Emerson Madrid / Feliz Horizonte Tech
