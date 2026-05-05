const { StatusCodes } = require("http-status-codes");
const { taskSchema,patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

/*This function will return the lists of tasks for the currently logged on user*/
async function index(req,res){   
    const result = await pool.query(`SELECT id, title, is_completed FROM tasks WHERE user_id = $1`,
  [global.user_id]
);   
   /* if(result.rows.length === 0){
      return res.status(StatusCodes.NOT_FOUND).json({message: "No Tasks for logged on User",}); 
    }  */
    return res.status(200).json(result.rows);
  
}
/*This creates a new entry in the list of tasks for the currently logged on user*/

async function create(req,res){
   if (!req.body) req.body = {};
    const {error,value} = taskSchema.validate(req.body,{ abortEarly: false });
     if(error){
       return res.status(StatusCodes.BAD_REQUEST).json({message : error.message});
     }
     

    const result  = await pool.query(`INSERT INTO tasks (title, is_completed, user_id) 
  VALUES ( $1, $2, $3 ) RETURNING id, title, is_completed`,
  [value.title, value.isCompleted, global.user_id]);
   
    
    return res.status(StatusCodes.CREATED).json(result.rows[0]);   
   
};

/*Returns the task with a particular ID for the currently logged on user*/
async function show(req,res){
  /*  const taskToShow = parseInt(req.params?.id);
    if(isNaN(taskToShow)){
      return res.status(400). json({message :" The task ID passed is invalid"})
    }*/
    const task = await pool.query(`SELECT id, title, is_completed FROM tasks where user_id = $1 and id =$2`,[global.user_id,req.params.id]);
   
   if(task.rows.length === 0){
    return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
   }
   return res.status(200).json(task.rows[0]);
}

/*Updates the task with a particular ID for the currently logged on user*/
async function update(req,res){
 /* const taskToFind = parseInt(req.params?.id);
    if (isNaN(taskToFind)) {
       return res.status(400).json({message: "The task ID passed is not valid."})
    }*/
    if (!req.body) req.body = {};
    const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

    if(error){
       return res.status(StatusCodes.BAD_REQUEST).json({message: error.message});
    }
    let keys = Object.keys(value);
    keys = keys.map((key) => key === "isCompleted" ? "is_completed" : key);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const idParm = `$${keys.length + 1}`;
    const userParm = `$${keys.length + 2}`;
    const updatedTask = await pool.query(`UPDATE tasks SET ${setClauses} 
             WHERE id = ${idParm} AND user_id = ${userParm} RETURNING id, title, is_completed`, 
             [...Object.values(value), req.params.id, global.user_id]);
    if(updatedTask.rows.length === 0){
       return res.status(StatusCodes.NOT_FOUND).json({message:"Task not found"});
    }         
    return res.status(200). json(updatedTask.rows[0]);
    
}
/*Deletes the task with a particular ID of the currently logged on user*/
async function deleteTask(req,res){
  /*const taskToFind = parseInt(req.params?.id); 
if (!taskToFind) {
  return res.status(400).json({message: "The task ID passed is not valid."})
}*/
const deletedTask = await pool.query(
    `DELETE FROM tasks
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, is_completed`,
    [req.params.id, global.user_id]
  );

if(deletedTask.rows.length === 0){
  return res.status(StatusCodes.NOT_FOUND).json({message: "That task was not found"}); 
}
return res.status(200).json(deletedTask.rows[0]); 
};

module.exports= {index,create,show,update,deleteTask};
