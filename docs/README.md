# AdminiX Project Documentation

Welcome to the AdminiX project documentation. This folder contains comprehensive documentation for the various systems and features of the AdminiX project management platform.

## 📚 Documentation Index

### Core Systems

- **[Activity Log System](./ACTIVITY_LOG_SYSTEM.md)** - Comprehensive activity logging with professional formatting
- **[Notification System](./NOTIFICATION_SYSTEM.md)** - Real-time notifications with Socket.IO integration

### Testing

- **[Testing Guide](../tests/README.md)** - Complete testing framework and guidelines

## 🏗️ Project Overview

AdminiX is a comprehensive project management platform that includes:

- **Project Management** - Create, manage, and track projects
- **Task Management** - Assign, update, and monitor tasks
- **Team Collaboration** - User management and permissions
- **File Management** - Upload and organize project files
- **Meeting Scheduling** - Schedule and manage team meetings
- **Sprint Management** - Agile sprint planning and tracking
- **Activity Logging** - Detailed activity tracking with professional formatting
- **Real-time Notifications** - Instant notifications for all activities

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+ and npm
node --version
npm --version

# MongoDB (local or cloud)
# Git
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd adminix-project

# Install dependencies
npm run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev                    # Start both backend and frontend
npm run dev:backend           # Start backend only
npm run dev:frontend          # Start frontend only

# Testing
npm run test:all              # Run all tests
npm run test:unit             # Run unit tests
npm run test:integration      # Run integration tests
npm run test:api              # Run API tests
npm run test:e2e              # Run end-to-end tests

# Building
npm run build                 # Build for production
npm run start                 # Start production server

# Code Quality
npm run lint                  # Run linting
npm run lint:fix             # Fix linting issues
npm run format               # Format code with Prettier
```

## 📁 Project Structure

```
adminix-project/
├── backend/                  # Express.js API server
│   ├── src/
│   │   ├── controllers/     # API route handlers
│   │   ├── models/          # Mongoose data models
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API route definitions
│   │   └── utils/           # Utility functions
│   └── package.json
├── client/                   # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── page/           # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── context/        # React context providers
│   └── package.json
├── tests/                    # Testing framework
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── api/                # API tests
│   └── e2e/                # End-to-end tests
├── docs/                    # Documentation
│   ├── ACTIVITY_LOG_SYSTEM.md
│   ├── NOTIFICATION_SYSTEM.md
│   └── README.md
└── package.json
```

## 🔧 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Multer** - File upload handling
- **GridFS** - File storage

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **React Router** - Navigation
- **Socket.IO Client** - Real-time updates

### Testing
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **Cypress** - End-to-end testing
- **Supertest** - API testing

## 🗄️ Database Schema

### Core Models
- **User** - User accounts and profiles
- **Workspace** - Team workspaces
- **Project** - Project definitions
- **Task** - Individual tasks
- **Sprint** - Agile sprints
- **Meeting** - Scheduled meetings
- **File** - Uploaded files
- **Activity** - Activity log entries
- **Notification** - User notifications

## 🔐 Authentication & Authorization

The system uses JWT-based authentication with role-based access control:

- **Super Admin** - Full system access
- **Workspace Admin** - Workspace management
- **Project Manager** - Project management
- **Team Member** - Basic project access
- **Viewer** - Read-only access

## 📊 Features

### Project Management
- Create and manage projects
- Set project status and priorities
- Track project progress
- File upload and management
- Team member assignment

### Task Management
- Create and assign tasks
- Set task priorities and status
- Track task progress
- Add comments and attachments
- Task dependencies

### Team Collaboration
- User invitation and management
- Role-based permissions
- Real-time activity updates
- Team communication tools

### Meeting Management
- Schedule team meetings
- Google Meet integration
- Meeting reminders
- Meeting notes and follow-ups

### Sprint Management
- Create and manage sprints
- Task assignment to sprints
- Sprint progress tracking
- Burndown charts

### Activity Logging
- Comprehensive activity tracking
- Professional message formatting
- Activity filtering and search
- Pinned activities

### Notifications
- Real-time notifications
- Email notifications
- Notification preferences
- Read/unread status

## 🧪 Testing Strategy

### Test Types
- **Unit Tests** - Individual component/function testing
- **Integration Tests** - Component interaction testing
- **API Tests** - Backend endpoint testing
- **E2E Tests** - Complete user workflow testing

### Test Coverage
- **Unit Tests**: 90%+ coverage target
- **Integration Tests**: 80%+ coverage target
- **API Tests**: 95%+ endpoint coverage
- **E2E Tests**: Critical user paths

## 🚀 Deployment

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/adminix
MONGODB_TEST_URI=mongodb://localhost:27017/adminix-test

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Storage
GRIDFS_BUCKET=uploads
MAX_FILE_SIZE=10485760

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the documentation in this folder
- Review the testing guide
- Open an issue on GitHub
- Contact the development team

---

**AdminiX** - Comprehensive Project Management Platform
