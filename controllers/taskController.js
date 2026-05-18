const { StatusCodes } = require("http-status-codes");
const { taskSchema,patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

/*This function will return the lists of tasks for the currently logged on user*/
async function index(req,res){   
  // Parse pagination parameters
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 10;
const skip = (page - 1) * limit;

// Build where clause with optional search filter
const whereClause = { userId: global.user_id };

if (req.query.find) {
  whereClause.title = {
    contains: req.query.find,        // Matches %find% pattern
    mode: 'insensitive'              // Case-insensitive search (ILIKE in PostgreSQL)
  };
}

const getOrderBy = (query) => {
  const validSortFields = ["title", "priority", "createdAt", "id", "isCompleted"];
  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";
  
  if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection };
  }
  return { createdAt: "desc" }; // default fallback
};

   //Get tasks with pagination and eager loading
  const tasks = await prisma.task.findMany({
  where: 
    whereClause, // using global.user_id from auth
  
  select: { 
    id: true,
    title: true, 
    isCompleted: true,
    priority: true,
    createdAt: true,
    User: {
      select: {
        name: true,
        email: true
      }
    }
  },
  skip: skip,
  take: limit,
  orderBy: getOrderBy(req.query),
});

if(tasks.length === 0){
      return res.status(StatusCodes.NOT_FOUND).json({message: "No Tasks for logged on User",}); 
 } 
// Get total count for pagination metadata
const totalTasks = await prisma.task.count({
  where:  whereClause
});

// Build pagination object with complete metadata
const pagination = {
  page,
  limit,
  total: totalTasks,
  pages: Math.ceil(totalTasks / limit),
  hasNext: page * limit < totalTasks,
  hasPrev: page > 1
};

     
    // Return tasks with pagination information
return res.status(200).json({
  tasks:tasks,
  pagination:pagination
});
   
}

/*This creates a new entry in the list of tasks for the currently logged on user*/

async function create(req,res){
   if (!req.body) req.body = {};
    const {error,value} = taskSchema.validate(req.body,{ abortEarly: false });
     if(error){
       return res.status(StatusCodes.BAD_REQUEST).json({message : error.message});
     }
    const result = await prisma.task.create({ data:{title:value.title,isCompleted:value.isCompleted,userId:global.user_id,priority:value.priority},
                        select : {title:true,isCompleted:true,id:true,priority:true}});         
    return res.status(StatusCodes.CREATED).json(result);      
};

/*Returns the task with a particular ID for the currently logged on user*/
async function show(req,res,next){
    const taskToShow = parseInt(req.params?.id);
    if(isNaN(taskToShow)){
      return res.status(400). json({message :" The task ID passed is invalid"})
    }
  try{    
   const task = await prisma.task.findUnique({ where: { id: taskToShow,userId:global.user_id } ,
                                select: { title: true, isCompleted: true, id: true,priority:true,createdAt:true,
                                    User: {   select: { name: true,email: true } }}}); 
    if(!task){
     return res.status(404).json({message: "The task was not found."});
   }                                
    return res.status(200).json(task);                             
   }
   
   catch (err) {         
              return next(err); // pass other errors to the global error handler   
      }                            
}

/*Updates the task with a particular ID for the currently logged on user*/
async function update(req,res,next){
  const taskToFind = parseInt(req.params?.id);
    if (isNaN(taskToFind)) {
       return res.status(400).json({message: "The task ID passed is not valid."})
    }
    if (!req.body) req.body = {};
    const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

    if(error){
       return res.status(StatusCodes.BAD_REQUEST).json({message: error.message});
    }
    try {
      const updatedTask = await prisma.task.update({ data: value,
                              where: {id: taskToFind, userId: global.user_id,},
                          select: { title: true, isCompleted: true, id: true,priority:true }});
       return res.status(200).json(updatedTask);                    

    } catch (err) {
          if (err.code === "P2025" ) {
                return res.status(404).json({ message: "The task was not found."})
          } else {
              return next(err); // pass other errors to the global error handler
          }
     }          
  
} //End of update

/*Deletes the task with a particular ID of the currently logged on user*/
async function deleteTask(req,res,next){
  const taskToFind = parseInt(req.params?.id); 
  if (!taskToFind) {
     return res.status(400).json({message: "The task ID passed is not valid."})
   }
try{
  const deletedTask = await prisma.task.delete({ where: {id: taskToFind, userId: global.user_id,},
                          select: { title: true, isCompleted: true, id: true,priority:true }});
  return res.status(200).json(deletedTask);                         
  }
  catch (err) {
          if (err.code === "P2025" ) {
                return res.status(404).json({ message: "The task was not found."})
          } else {
              return next(err); // pass other errors to the global error handler
          }
     }    
};

//Create Multiple tasks in a single database operation createMany
async function bulkCreate(req,res,next){
 const { tasks } = req.body;
 //validate the tasks array
 if(!tasks || !Array.isArray(tasks) || tasks.length === 0){
   return res.status(400).json({error: "Invalid request data. Expected an array of tasks."})
 };

//validate all tasks before insertion
const validTasks = [];
for(const task of tasks){
  const {error,value} = taskSchema.validate(task);
  if(error){
    return res.status(400).json({
      error: "Validation failed",
      details: error.details,
    });
  }
  validTasks.push({
    title: value.title,
    isCompleted:value.isCompleted || false,
    priority: value.priority || 'medium',
    userId:global.user_id
  });
}//end of For loop
//use CreateMany for batch insertion
try{
  const result = await prisma.task.createMany({
    data: validTasks,
    skipDuplicates:false
  });
  res.status(201).json({
    message:"success!",
    tasksCreated:result.count,
    totalRequested: validTasks.length
  });
}//end of try
catch(err){
  return next(err);
}
};
module.exports= {index,create,show,update,deleteTask,bulkCreate};