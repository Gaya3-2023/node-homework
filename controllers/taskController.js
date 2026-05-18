const { StatusCodes } = require("http-status-codes");
const { taskSchema,patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

/*This function will return the lists of tasks for the currently logged on user*/
async function index(req,res){   
    const tasks = await prisma.task.findMany({ where: {  userId: global.user_id,},
                select: { title: true, isCompleted: true, id: true }});  
   if(tasks.length === 0){
      return res.status(StatusCodes.NOT_FOUND).json({message: "No Tasks for logged on User",}); 
    }  
    return res.status(200).json(tasks);
  
}

/*This creates a new entry in the list of tasks for the currently logged on user*/

async function create(req,res){
   if (!req.body) req.body = {};
    const {error,value} = taskSchema.validate(req.body,{ abortEarly: false });
     if(error){
       return res.status(StatusCodes.BAD_REQUEST).json({message : error.message});
     }
    const result = await prisma.task.create({ data:{title:value.title,isCompleted:value.isCompleted,userId:global.user_id},
    select : {title:true,isCompleted:true,id:true}});         
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
                                select: { title: true, isCompleted: true, id: true }}); 
    return res.status(200).json(task);                             
   }
   catch (err) {
          if (err.code === "P2025" ) {
                return res.status(404).json({ message: "The task was not found."})
          } else {
              return next(err); // pass other errors to the global error handler
          }
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
                          select: { title: true, isCompleted: true, id: true }});
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
                          select: { title: true, isCompleted: true, id: true }});
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

module.exports= {index,create,show,update,deleteTask};