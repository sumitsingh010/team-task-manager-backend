# Team Task Manager — Backend API

A RESTful API built with **Node.js**, **Express.js**, and **MongoDB** for managing team projects and tasks with role-based access control.

## 🚀 Live Demo

- **Frontend**: [https://team-task-manager-frontend-seven.vercel.app](https://team-task-manager-frontend-seven.vercel.app)
- **Backend API**: [https://team-task-manager-backend-l5zf.onrender.com](https://team-task-manager-backend-l5zf.onrender.com)

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Authentication**: JWT + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS

## 📋 Features

- JWT-based authentication (Signup/Login)
- Role-based access control (Admin / Member)
- First signup automatically becomes Admin
- Project CRUD with team member management
- Task CRUD with assignment, priority, and due dates
- Dashboard analytics (task stats, overdue detection)
- Input validation and error handling

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create a project (Admin) |
| GET | `/api/projects/:id` | Get project details + tasks |
| PUT | `/api/projects/:id` | Update project (Admin) |
| DELETE | `/api/projects/:id` | Delete project (Admin) |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get tasks (with filters) |
| POST | `/api/tasks` | Create task (Admin) |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (Admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get analytics & stats |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (Admin) |

## 🏗 Project Structure

```
backend/
├── controllers/
│   ├── authController.js
│   ├── dashboardController.js
│   ├── projectController.js
│   ├── taskController.js
│   └── userController.js
├── middleware/
│   ├── auth.js
│   └── validate.js
├── models/
│   ├── User.js
│   ├── Project.js
│   └── Task.js
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   └── userRoutes.js
├── utils/
│   └── generateToken.js
├── server.js
└── package.json
```

## ⚙️ Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (development/production) |
| `FRONTEND_URL` | Frontend URL for CORS |

## 🚀 Deployment

- **Backend**: Deployed on [Render](https://render.com)
- **Frontend**: Deployed on [Vercel](https://vercel.com)
- **Database**: MongoDB Atlas (Free Tier)
