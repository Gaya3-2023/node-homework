const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");

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


async function register(req,res){
   if(!req.body) req.body={};
    const { error, value } = userSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }
   //Hash the password
   const hashedPassword = await hashPassword(value.password);

   const newUser = {name:value.name,
                    email:value.email,
                    hashedPassword
   }; 
   console.log(newUser);
    global.users.push(newUser);
    global.user_id = newUser.email;  
    delete req.body.password;
    return  res.status(StatusCodes.CREATED)
       .json({message: "User Created", user:req.body});     
  }

async function logon(req,res){
    if(!req.body) req.body={};   
    const findUser = global.users.find((user) => user.email === req.body.email);
    if(!findUser){
        return res.status(StatusCodes.UNAUTHORIZED)
                  .json({message:"Authentication Failed"});   
    }
    //compare hashed password
    const isMatch = await comparePassword(req.body.password,findUser.hashedPassword);
    if(!isMatch){
        return res.status(StatusCodes.UNAUTHORIZED)
               .json({message:"Authentication Failed"});
    }

    global.user_id = findUser.email;
        return res.status(StatusCodes.OK)
                  .json({message:"Success" , name: findUser.name, email: findUser.email}); 
}

function logoff(req,res){
    global.user_id = null;
    return res.sendStatus(StatusCodes.OK);

}

module.exports={register,logon,logoff};
