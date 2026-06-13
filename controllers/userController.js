const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_SECRET_ID,
          process.env.GOOGLE_REDIRECT_URI);

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    //sameSite: "Strict",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",    
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};


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
   let isPerson = false;
  
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (    
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Bot verification failed. Please complete the reCAPTCHA." });
  }
  
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
     const csrfToken = setJwtCookie(req,res,result.user);
     //global.user_id = result.user.id;
    
     res.status(201);
     res.json({
      user: result.user,
      welcomeTasks:result.welcomeTasks,
      transactionStatus:"success",
      csrfToken:csrfToken
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
     // const email = req.body.email;   
    const email = req.body.email?.trim().toLowerCase();  //since neon is storing the email in lowercase
    const result = await prisma.user.findUnique({ where: { email : email }});
    if(!result){
       return res.status(StatusCodes.UNAUTHORIZED)
                  .json({message:"Invalid credentials"});  
     }
    //compare hashed password
    const isMatch = await comparePassword(req.body.password,result.hashedPassword);
    if(!isMatch){
        return res.status(StatusCodes.UNAUTHORIZED)
               .json({message:"Authentication Failed"});
    }
    //global.user_id = result.id //findUser.email;
    const csrfToken = setJwtCookie(req,res,result);
        return res.status(StatusCodes.OK)
                  .json({message:"success" , name: result.name, email: result.email, csrfToken:csrfToken}); 
};

function logoff(req,res){
   // global.user_id = null;
    res.clearCookie("jwt", cookieFlags(req));
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

//Logon with  Google
async function googleLogon(req,res,next){
  try{
    const { code } = req.body;
   // console.log(`inside googleLogon credential - ${code}`);
    if (!code) {
      return res.status(400).json({ error: 'No credential provided' });
    }
     const { tokens } = await client.getToken(code);
    // console.log(tokens);
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
   // console.log(ticket);    
    const payload = ticket.getPayload();
   // console.log(payload);
    //const { sub: googleId, email, name } = payload;
    const email = payload.email;
    const name = payload.name;
   // console.log(`email : ${email}    ; name: ${name}`);
    //Check database for existing users or create new
     let user = await prisma.user.findUnique({ where: { email: email }});
   //  console.log(user);
     if(!user){  //create a new record with 3 welcome tasks
      /*user= await prisma.user.create({data: {email:email,name:name,hashedPassword:"googleUser"},
                                       select:{name:true,email:true,id:true}}); */

      const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({data: {email:email,name:name,hashedPassword:"googleUser"},select:{name:true,email:true,id:true}})
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
      });//end of transactions
        const csrfToken = setJwtCookie(req,res,result.user); 
       // res.send({message:"for new user",user:result.user,csrfToken:csrfToken});
       return res.status(201).json({
           user: result.user,
           welcomeTasks:result.welcomeTasks,
           transactionStatus:"success",
           csrfToken:csrfToken
     });                               
     }
     else{ //if user have a database record
        const csrfToken = setJwtCookie(req,res,user);  
      //  res.send({message :"user exists already",user:user,csrfToken:csrfToken});
     return res.status(201).json({
      user: user,
      csrfToken:csrfToken
     }); 
     }   
    
  }
  catch(error){
    next(error);
  }
};

module.exports={register,logon,logoff,show,googleLogon};