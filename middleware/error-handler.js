const { StatusCodes } = require("http-status-codes");
const prisma = require("../db/prisma" ) ;      

const errorHandlerMiddleware = (err, req, res,next) => {
  console.error(
    "Internal server error: ",
    err.constructor.name,
    JSON.stringify(err, ["name", "message", "stack"]),
  );
  
  //Prisma Error Handling
  if(err instanceof prisma.PrismaClientInitializationError){
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message : "Database Connection Failed."});
  }
  if (!res.headersSent) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({message:"An internal server error occurred."});
  }
  next(err);
};

module.exports = errorHandlerMiddleware;