const { StatusCodes } = require("http-status-codes");
const { taskSchema,patchTaskSchema } = require("../validation/taskSchema");
const { userSchema } = require("../validation/userSchema");

/*Generate a unique ID for each task*/
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

/*This function will return the lists of tasks for the currently logged on user*/
function index(req,res){   
    const userTasks = global.tasks.filter((task) => task.userId === global.user_id);
    if(userTasks.length !== 0){
    const sanitizedTasks = userTasks.map((task) => {
      const {userId , ...sanitizedTask} = task;
      return sanitizedTask;
    });
    return res.status(200).json(sanitizedTasks);
   }      
   else{
    return res.status(404).json({message: "No Tasks for logged on User"}); 
   }
}
/*This creates a new entry in the list of tasks for the currently logged on user*/
function create(req,res){
   if (!req.body) req.body = {};
    const {error,value} = taskSchema.validate(req.body,{abortEarly:false});
     if(error){
       return res.status(400).json({message : error.message});
     }
     else{

    const newTask = { ...value,id:taskCounter(),userId: global.user_id};
    global.tasks.push(newTask);
    const {userId, ...sanitizedTask} = newTask; 
    // we don't send back the userId! This statement removes it.
    //res.json(sanitizedTask);
    return res.status(201).json(sanitizedTask);
     }

}
/*Returns the task with a particular ID for the currently logged on user*/
function show(req,res){
    const taskToShow = parseInt(req.params?.id);
    if(!taskToShow){
      return res.status(400). json({message :" The task ID passed is invalid"})
    }
    const taskShowIndex = global.tasks.findIndex((task) => task.id === taskToShow && task.userId === global.user_id);
    if (taskShowIndex === -1) { // if no such task
        return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
    }
    else{
      const { userId , ...sanitizedTask} = global.tasks[taskShowIndex];
    return res.status(200).json(sanitizedTask);
    }
}

/*Updates the task with a particular ID for the currently logged on user*/
function update(req,res){
  const taskToFind = parseInt(req.params?.id);
    if (!taskToFind) {
       return res.status(400).json({message: "The task ID passed is not valid."})
    }
    const taskUpdate= global.tasks.find((task) => task.id === taskToFind && task.userId === global.user_id);
    if (!taskUpdate) { // if no such task
        return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
    }
    else{ 
       if (!req.body) req.body = {};
        const { error, value } = patchTaskSchema.validate(req.body, { abortEarly: false});
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      Object.assign(taskUpdate, value);
      return res.status(200). json({message: "Task updated successfully"});
       //return res.status(200).json(sanitizedTask)
    }
}
/*Deletes the task with a particular ID of the currently logged on user*/
function deleteTask(req,res){
  const taskToFind = parseInt(req.params?.id); 
if (!taskToFind) {
  return res.status(400).json({message: "The task ID passed is not valid."})
}
const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind && task.userId === global.user_id);
// we get the index, not the task, so that we can splice it out
if (taskIndex === -1) { // if no such task
  return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
  // else it's a 404.
}
const { userId, ...task } = global.tasks[taskIndex];
// pull userId out and keep a copy of everything else, so the response is sanitized
global.tasks.splice(taskIndex, 1); // do the delete
return res.json(task); // return the deleted entry without its userId. The default status code, OK, is returned

}

module.exports= {index,create,show,update,deleteTask};
