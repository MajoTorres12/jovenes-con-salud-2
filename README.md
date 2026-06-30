# 🏥 Jóvenes con Salud

Plataforma digital del **Instituto de la Juventud de Tamaulipas** para promover hábitos de vida saludable en jóvenes de 12 a 29 años.

## Estructura del Proyecto

```
jovenes-con-salud/
├── client/          # Frontend — React + Vite + Tailwind CSS v4
└── server/          # Backend  — Node.js + Express + Sequelize + PostgreSQL
```

## Requisitos

- **Node.js** v18+
- **PostgreSQL** v14+ (opcional para desarrollo inicial)
- **Git**

## Inicio Rápido

### Frontend
```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd server
cp .env.example .env   # Configurar variables de entorno
npm install
npm run dev
# → http://localhost:3001/api/health
```

## Tecnologías

| Capa      | Tecnología                          |
|-----------|-------------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS v4     |
| Backend   | Express 5, Sequelize, PostgreSQL    |
| Auth      | JWT + bcrypt                        |
| HTTP      | Axios                               |

## Licencia

MIT — Instituto de la Juventud de Tamaulipas
