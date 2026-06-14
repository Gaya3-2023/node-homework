## NODE-HOMEWORK

# Description

A task management backend built with Node.js, Express, Neon PostgreSQL, JWT, and Google OAuth. This API supports user authentication, task CRUD operations, bulk task actions, analytics endpoints, and deployment on Render.

# Features

User registration, logon, logoff, and profile retrieval.
Google OAuth sign-in and JWT-based authentication.
Task creation, update, deletion, pagination, and search.
Bulk task create, update, and delete operations.
Analytics endpoints for users and tasks insights.
Backend deployment on Render with Neon PostgreSQL

# Tech Stack

- Backend: Node.js/Express
- Database: Neon PostgresQL
- Authentication: JWT/Google OAuth
- Deployment: Render

# Project Setup Dependencies

   This project uses the following dependencies. They were installed during development to support backend functionality,security,database integration, and testing.
 
    - Core Server
      - npm install express  
      - npm install nodemon --save-dev   -- Nodemon -to automatically restart your app when you make a code change

    - Environment and database
      - npm install pg dotenv   -- installs the necessary packages for PostgreSQL Integration
      - npm install prisma @prisma/client
      - npx prisma init

    - Authentication and security
      - npm install jsonwebtoken cookie-parser express-xss-sanitizer express-rate-limit helmet

        - jsonwebtoken - For creating and verifying JWT tokens
        - cookie-parser - For parsing cookies from HTTP requests
        - express-xss-sanitizer - For protecting against XSS attacks
        - express-rate-limit - For rate limiting API requests
        - helmet - For setting security-related HTTP headers 

    -Testing
      - npm install jest --save-dev
      - npm install supertest --save-dev
      - npm install node-mocks-http --save-dev

    - Tooling
      - npm install eslint-plugin-jest --save-dev 
      - npm install globals --save-dev
      - npm install cookies --save-dev


 
# Quick Start

-	Clone the repository
-	Install dependencies with npm install
-	Add your environment variables
-	Start the app with npm run dev

# Environment Variables:

Add the following environment variables in Render(in your local .env for development):

- DATABASE_URL=your_database_url
- JWT_SECRET=your_secret
- GOOGLE_CLIENT_ID=your_client_id
- GOOGLE_CLIENT_SECRET=your_client_secret
- GOOGLE_REDIRECT_URI=your frontend URL
- NODE_ENV=production
- RECAPTCHA_BYPASS=your recaptcha bypass
- RECAPTCHA_SECRET=your recaptcha secret

       
# How to run

# Development

- Start the backend server: npm run dev
- Test the API routes using the VS Code Postman extension
- If you are testing with the frontend, start both the frontend and backend servers
- Make sure the frontend .env file includes: VITE_TARGET=http://localhost:3000

# Production

- Start the frontend server: npm run dev
- Make sure the frontend .env file includes the deployed backend URL: VITE_TARGET=Render Live URL        


# API Endpoints

User Routes:

- POST - /api/users/register  - User registration with 3 welcomeTasks
- POST - /api/users/logon - User Logon
- POST - /api/users/googleLogon - Logon with Google
- GET  - /api/users/:id  - show
- POST - /api/users/logoff  - User Logoff

Tasks Routes:

- GET - /api/tasks  -  List tasks with pagination,eager loading  and search filter
- POST - /api/tasks - Create a single task
- POST - /api/tasks/bulk - Create bulk tasks
- DELETE - /api/tasks/bulkDelete - Bulk task deletion
- PATCH - /api/tasks/bulkUpdateWithIds - Bulk update with ids
- PATCH - /api/tasks/bulkUpdate - Bulk Partial Update
- GET - /api/tasks/:id - Show task with user Info(eager loading)
- PATCH - /api/tasks/:id - Update a task
- DELETE - /api/tasks/:id - Delete a task

Analytics Routes:
- GET - /api/analytics/users/:id - User analytics with groupBy operations
- GET - /api/analytics/users - Users with stats and pagination
- GET - /api/analytics/tasks/search -  Task Search with RAW SQL


# Testing
npm run test

# Deployment

- Backend : Render
- Live URL: https://node-homework-263.onrender.com
- Database : Neon postgreSQL

# Suggested Project Structure
As the project grows, consider organizing it into folders such as controllers, routes, middleware, models, services, and config to improve maintainability and scalability.

# Contributing
Contributions are welcome. If you’d like to improve this project, feel free to fork the repository, create a feature branch, and open a pull request.

# License
This project is available under the MIT License

