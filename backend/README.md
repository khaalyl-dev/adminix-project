# Backend Setup Guide

This README provides instructions for setting up and testing the backend of the AdminiX project.

## Prerequisites
- Node.js (v16 or higher recommended)
- npm (comes with Node.js)
- MongoDB database (cloud or local)

## Environment Variables
A `.env` file is already created in the `backend` directory. **You must review and update the following variables as needed for your environment:**

- **MONGO_URL**: Replace with your own MongoDB connection string if you are not using the provided one. You can get this from your MongoDB Atlas dashboard or your local MongoDB instance.
- **SESSION_SECRET**: Change this to a secure, random string for session security.
- **GOOGLE_CLIENT_ID** and **GOOGLE_CLIENT_SECRET**: 
  - Obtain these from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) by creating OAuth 2.0 credentials for your project.
  - **Enable the Google Calendar API and Google Meet API** for your project in the Google Cloud Console.
  - **Add test user email addresses** under "OAuth consent screen" > "Test users" so you can log in with those accounts during development.


Example `.env` file:

```env
# Server port
PORT=8000

# Application environment (development, production, etc.)
NODE_ENV=development

# MongoDB connection string
MONGO_URL=your_mongodb_connection_string_here

# Session secret and expiration settings
SESSION_SECRET=your_secure_session_secret
SESSION_EXPIRES_IN=id

# Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Frontend application URLs
FRONTEND_ORIGIN=http://localhost:5173
FRONTEND_GOOGLE_CALLBACK_URL=http://localhost:5173/google/oauth/callback

# Socket server URL for real-time features
VITE_SOCKET_URL=http://localhost:5000
```

## Installation
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## Running the Application
- Start the development server:
  ```sh
  npm run dev
  ```
- The server will run on the port specified in your `.env` file (default: 8000).

## Testing the Application
- Ensure MongoDB is accessible with the provided `MONGO_URL`.
- Use tools like Postman or Insomnia to test API endpoints (e.g., `http://localhost:8000/api/...`).
- For Google OAuth, ensure your Google credentials are set, the required APIs are enabled, and the callback URL matches your Google app settings.

## Additional Notes
- Make sure the frontend is running on the URL specified in `FRONTEND_ORIGIN` for CORS and OAuth to work correctly.
- For real-time features, ensure the socket server is running at `VITE_SOCKET_URL`.

---
For any issues, please refer to the code comments and documentation in each directory, or contact the project maintainer. 