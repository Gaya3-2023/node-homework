const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}


async function register(req,res,next){
   if(!req.body) req.body={};
   const { error, value } = userSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    return res.status(400).json({ message: error.message,details: error.details, });
  }
   //let user = null;
   //Hash the password
   const { password, ...cleanData } = value;
   const hashedPassword = await hashPassword(password);
    
   try{
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({data: {...cleanData,hashedPassword},select:{name:true,email:true,id:true}})
      //Create 3 welcome tasks using createMany
      const welcomeTaskData = [ 
       {title:"Complete your profile",userId:newUser.id,priority:"medium"},
       {title:"Add your first task",userId:newUser.id,priority:"high"},
       {title:"Explore the app",userId:newUser.id,priority:"low"}];
       await tx.task.createMany({data: welcomeTaskData});
       //Fetch the created tasks to return them
       const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title : { in: welcomeTaskData.map(t=>t.title)}
        },
        select:{
          id:true,
          title:true,
          isCompleted:true,
          userId:true,
          priority:true
        }
       });
       return{ user:newUser,welcomeTasks};
    }) //end of prisma.$transaction
     //store the user ID globally for session management(not secure for production)
     global.user_id = result.user.id;
     
     res.status(201);
     res.json({
      user: result.user,
      welcomeTasks:result.welcomeTasks,
      transactionStatus:"success"
     });
     return;
   } //end of try
   catch(err){
    if(err.code === "P2002"){
      return res.status(400).json({error: "Email already registered"});
    }
    else{
      return next(err);  //error handler takes care of other errors
    }
   }//end of catch   
};

async function logon(req,res){
    if(!req.body) req.body={}; 
    const email = req.body.email;   
    const result = await prisma.user.findUnique({ where: { email : email }});
    if(!result){
       return res.status(StatusCodes.UNAUTHORIZED)
                  .json({message:"Authentication Failed"});  
     }
    //compare hashed password
    const isMatch = await comparePassword(req.body.password,result.hashedPassword);
    if(!isMatch){
        return res.status(StatusCodes.UNAUTHORIZED)
               .json({message:"Authentication Failed"});
    }
    global.user_id = result.id //findUser.email;
        return res.status(StatusCodes.OK)
                  .json({message:"success" , name: result.name, email: result.email}); 
};

function logoff(req,res){
    global.user_id = null;
    return res.sendStatus(StatusCodes.OK);

};

async function show (req, res) {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: { 
          id: true, 
          title: true, 
          priority: true,
          createdAt: true 
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({User:user});
};

module.exports={register,logon,logoff,show};