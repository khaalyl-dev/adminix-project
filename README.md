# AdminiX Project - Monorepo

This repository contains both the **backend** (Node.js/Express/TypeScript) and **client** (React/TypeScript/Vite) for the AdminiX workspace management application.

---

## Project Structure

```
adminix-project/
│
├── backend/   # Node.js/Express/TypeScript backend API
│   ├── src/   # Source code (controllers, models, routes, services, etc.)
│   ├── dist/  # Compiled output
│   ├── package.json
│   └── ...
│
├── client/    # React/TypeScript frontend (Vite)
│   ├── src/   # Source code (components, pages, hooks, etc.)
│   ├── public/
│   ├── package.json
│   └── ...
│
├── README.md  # (this file)
└── ...
```

---

## Features
- Workspace, project, and task management
- Google OAuth and Google Meet integration
- Real-time notifications
- Role-based permissions
- Activity log and analytics
- **🤖 AI-Powered Analytics** - Task prediction, sprint planning, and project analysis
- Responsive, modern UI

---

## Prerequisites
- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (Atlas or local)
- **Python 3.9+** (for AI features)

---

## Setup Instructions

### 1. Clone the Repository
```sh
# Clone the repo
https://github.com/your-username/adminix-project.git
cd adminix-project
```

### 2. Install Dependencies
#### Backend
```sh
cd backend
npm install
```
#### Client
```sh
cd ../client
npm install
```

### 3. Environment Variables
#### Backend
- Copy `.env.example` to `.env` in the `backend/` folder (or create `.env` if not present):
- Fill in the required values:
  - `PORT`, `MONGO_URL`, `SESSION_SECRET`, Google OAuth credentials, etc.

#### Client
- If you have environment variables for the client (e.g., Vite), create a `.env` file in `client/` as needed.

### 4. Running the Applications

#### Option 1: Quick Start (Recommended)
```sh
./start-all.sh
```
This script will automatically start all services including the AI features.

#### Option 2: Manual Start
**You must start the backend and client separately in two terminal windows:**

##### Start Backend
```sh
cd backend
npm run dev
# or: npm start
```
- The backend will run on the port specified in `.env` (default: 5000).

##### Start Client
```sh
cd client
npm run dev
```
- The client will run on [http://localhost:5173](http://localhost:5173) by default.

##### Start AI Service (Optional)
```sh
cd ml-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python start.py
```
- The AI service will run on [http://localhost:8000](http://localhost:8000).

---

## Folder Details

### Backend (`/backend`)
- **src/controllers/**: Express route controllers
- **src/models/**: Mongoose models
- **src/routes/**: API route definitions
- **src/services/**: Business logic
- **src/middlewares/**: Express middlewares
- **src/config/**: App, DB, and auth config
- **src/seeders/**: Seed scripts for roles, superadmin, etc.
- **src/utils/**: Utility functions
- **src/validation/**: Request validation schemas
- **src/enums/**: Enum definitions
- **src/@types/**: TypeScript type definitions

### Client (`/client`)
- **src/components/**: Reusable UI and feature components
- **src/page/**: Main pages (workspace, project, auth, errors, etc.)
- **src/hooks/**: Custom React hooks
- **src/routes/**: React Router route definitions
- **src/types/**: TypeScript types/interfaces
- **src/context/**: React context providers
- **src/lib/**: API utilities, helpers
- **src/assets/**: Static assets
- **src/public/**: Public files (images, favicon, etc.)

### AI Service (`/ml-service`)
- **api.py**: FastAPI application with AI endpoints
- **model.py**: Formula Y assignment engine
- **ml.py**: ML prediction models
- **gemini.py**: AI task suggestions
- **start.py**: Service startup script
- **requirements.txt**: Python dependencies

---

## Google OAuth & Meet Integration
- You must set up Google OAuth credentials in the Google Cloud Console.
- Enable the Google Calendar and Google Meet APIs.
- Add test user emails in the OAuth consent screen.
- Set the correct callback URLs in both backend `.env` and Google Cloud Console.

---

## Developer Notes
- **Start backend and client separately** for local development.
- The backend serves only the API; the client is a separate Vite app.
- All code is TypeScript for type safety.
- See each subfolder's README for detailed file explanations.
- For real-time features, ensure the socket server (if used) is running and configured.

---

## AI Features

The AdminiX project now includes AI-powered analytics capabilities:

- **Task Prediction**: Analyze task complexity, risk, and priority
- **Sprint Planning**: Generate comprehensive sprint plans
- **Project Analysis**: Complete project analysis with worker assignment

For detailed information about the AI integration, see [AI_INTEGRATION.md](./AI_INTEGRATION.md).

## Contributing
- Please read and follow the code comments and folder-level READMEs.
- Use clear commit messages and document any major changes.
- Open issues or pull requests for bugs, features, or questions.

---
