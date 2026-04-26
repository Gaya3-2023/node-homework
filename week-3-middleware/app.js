const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dogsRouter = require('./routes/dogs');


const app = express();

//1.RequestID Middleware
   app.use((req,res,next) => {
      req.requestId = uuidv4();
      res.setHeader('X-Request-Id',req.requestId);
      next();
   });

//2.Logging Middleware
  app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
      next();
});

//3.Security headers Middleware
  app.use((req, res, next) => {
       res.setHeader("X-Content-Type-Options", "nosniff");
       res.setHeader("X-Frame-Options", "DENY");
       res.setHeader("X-XSS-Protection", "1; mode=block");
      next();
});

// 4.Body parsing Middleware
 app.use(express.json({ limit: "1mb" }));

//5.Content Type Validation Middleware
  app.use((req, res, next) => {
     if (req.method === 'POST') {
        const contentType = req.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          return res.status(400).json({
                error: 'Content-Type must be application/json',
                requestId: req.requestId
        });
     }
    }
    next();
  });

// Serve static files with custom path prefix]
  app.use(express.static(path.join(__dirname, 'public')));

//6. Routes
  app.use('/', dogsRouter); // Do not remove this line

//7.Error Handling MiddleWare -test with /error
  app.use((err, req, res, next) => {
    // Determine the status code from the error
     const statusCode = err.statusCode || 500;
  
    // Log based on error type
    if (statusCode >= 400 && statusCode < 500) {
      // 4xx errors: client errors (use console.warn)
      // This includes ValidationError (400), UnauthorizedError (401), NotFoundError (404)
      console.warn(`WARN: ${err.name}` + err.message);
    } else {
      // 5xx errors: server errors (use console.error)
     console.error(`ERROR: Error` + err.message);
    }
  
    // Send error response
    res.status(statusCode).json({
       error: err.message || 'Internal Server Error',
       requestId: req.requestId
     });
 });

//8. 404 handler 
 app.use((req, res) => {
     res.status(404).json({
       error: "Route not found",
       requestId: req.requestId
     });
 });
 
const server =	app.listen(3000, () => console.log("Server listening on port 3000"));
module.exports = server;