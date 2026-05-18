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
   let user = null;
   //Hash the password
   value.hashedPassword = await hashPassword(value.password);
  try {
    user = await prisma.user.create({
    data: { name:value.name, email: value.email, hashedPassword:value.hashedPassword },
    select: { name: true, email: true, id: true} 
  });  
    
  } catch (e) { 
    if(e.name === "PrismaClientKnownRequestError" && e.code === "P2002") {
        return res.status(400).json({message:"Unique constraint for Email was Violated"});
    }
  return next(e); // all other errors get passed to the error handler
}   
    global.user_id = user.id  //set global.user_id
    return res.status(201).json({name: user.name,
      email: user.email,});
 
};

async function logon(req,res){
    if(!req.body) req.body={}; 
    const email = req.body.email.toLowerCase() // Joi validation always converts the email to lower case   
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
                  .json({message:"Success" , name: result.name, email: result.email}); 
};

function logoff(req,res){
    global.user_id = null;
    return res.sendStatus(StatusCodes.OK);

};

module.exports={register,logon,logoff};