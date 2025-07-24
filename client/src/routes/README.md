# Routes Directory

This directory contains the main routing logic for the AdminiX client application. Each file is responsible for a specific aspect of route management:

- **index.tsx**: Sets up the main routing for the application using React Router, including public, protected, and authentication routes.
- **auth.route.tsx**: Defines the authentication route logic, handling access to auth pages and redirecting authenticated users.
- **protected.route.tsx**: Defines the protected route logic, ensuring only authenticated users can access certain pages.
- **common/**: Contains shared route definitions and utilities used across the app.
- **README.md**: This file. Explains the purpose and main functionality of each file in the folder.

Each file is commented to explain its main components and logic. 