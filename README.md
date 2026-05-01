# TaskFlow — Team Task Manager

A production-ready team task manager with role-based access control, Google OAuth, and a clean React + Tailwind frontend.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| Backend | Spring Boot 3.2, Java 21 |
| Database | PostgreSQL |
| Auth | JWT + Google OAuth2 |

## Project Structure

```
team-task-manager/
├── backend/           ← Spring Boot API
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/taskmanager/
│       │   ├── config/          SecurityConfig, CorsConfig
│       │   ├── controller/      AuthController, ProjectController, TaskController
│       │   ├── dto/             request + response records
│       │   ├── entity/          User, Project, ProjectMember, Task
│       │   ├── enums/           Role, TaskStatus, Priority
│       │   ├── exception/       AppException, GlobalExceptionHandler
│       │   ├── repository/      JPA repositories
│       │   ├── security/        JWT, OAuth2 handlers
│       │   └── service/         AuthService, ProjectService, TaskService
│       └── resources/
│           ├── application.yml
│           └── schema.sql
└── frontend/          ← React + Tailwind SPA
    └── src/
        ├── api/         axiosInstance + API modules
        ├── components/  TaskCard, TaskModal, PriorityBadge, etc.
        ├── context/     AuthContext
        ├── pages/       Login, Dashboard, ProjectView, OAuthCallback
        └── utils/       statusUtils
```

## Local Development

### Prerequisites
- Java 21, Maven 3.9+
- Node.js 20+, npm 9+
- PostgreSQL 15+

### Backend

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE taskmanager;
   ```

2. Set environment variables (or use `.env`):
   ```
   DATABASE_URL=jdbc:postgresql://localhost:5432/taskmanager
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your-256-bit-hex-secret
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   FRONTEND_URL=http://localhost:5173
   ```

3. Run:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

The schema runs automatically on first startup via `schema.sql`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register with email/password |
| POST | `/auth/login` | Public | Login → returns JWT |
| GET | `/auth/me` | JWT | Get current user profile |
| GET | `/oauth2/authorization/google` | Public | Start Google OAuth |

### Projects
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/projects` | Any member | List user's projects |
| POST | `/projects` | Admin | Create project |
| DELETE | `/projects/{id}` | Admin | Delete project |
| POST | `/projects/{id}/members` | Admin | Add member by email |

### Tasks
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/tasks?projectId=&page=&size=` | Member (own) / Admin (all) | List tasks |
| POST | `/tasks` | Admin | Create task |
| PATCH | `/tasks/{id}` | Assigned member / Admin | Update status + progress |
| DELETE | `/tasks/{id}` | Admin | Delete task |

## Business Rules

- **PENDING** → progress must be 0
- **IN_PROGRESS** → progress must be 1–99
- **DONE** → progress must be 100
- Tasks must be assigned to a project member
- Members can only see/update their own tasks
- Admins have full control over project and tasks

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md).
