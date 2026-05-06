const express = require("express");
const app = express();
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const authMiddleware = require("./middleware/auth");
const pool = require("./db/pg-pool");

global.user_id = null;
//global.users = [];
//global.tasks = [];

app.use((req, res, next) => {
  console.log(`${req.method}   ${req.path}   ${JSON.stringify(req.query)}`);
  next();
});

app.use(express.json({limit: "1kb"}));
app.use("/api/users",userRouter);
app.use("/api/tasks",authMiddleware,taskRouter);

app.get("/", (req, res) => {
  res.json({message: "Hello World!"});
});

app.post('/testpost',
       (req,res) => { 
          res.json({message:"POST Request Called"});
          });

//Health check endpoint to verify database connectivity
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ message: `db not connected, error: ${ err.message }` });
  }
});
        
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`),
    );

      
server.on('error', (err) => {
   if (err.code === "ECONNREFUSED" && err.port === 5432) { // the postgresql port
    console.log("The database connection was refused.  Is your database service running?");
  }
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');
  try {
    await new Promise(resolve => server.close(resolve));
    console.log('HTTP server closed.');
    // If you have DB connections, close them here
    await pool.end();
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    console.log('Exiting process...');
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0));  // ctrl+c
process.on('SIGTERM', () => shutdown(0)); // e.g. `docker stop`
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown(1);
});



module.exports = { app, server} ;