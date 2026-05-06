const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const pool = require("../db/pg-pool");

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
   value.hashed_password = await hashPassword(value.password);
  try {
    user = await pool.query(`INSERT INTO users (email, name, hashed_password) 
      VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password]
    ); // note that you use a parameterized query
    global.user_id = user.rows[0].id  //set global.user_id
    return res.status(201).json({name: user.rows[0].name,
      email: user.rows[0].email,});
    
  } catch (e) { // the email might already be registered
  if (e.code === "23505") { // this means the unique constraint for email was violated
     return res.status(400).json({message:"Unqiue constraint for Email was Violated"});
  }
  return next(e); // all other errors get passed to the error handler
}   
 
};

async function logon(req,res){
    if(!req.body) req.body={};   
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [req.body.email,]); 
     if(result.rows.length === 0 ){
       return res.status(StatusCodes.UNAUTHORIZED)
                  .json({message:"Authentication Failed"});  
     }

    //compare hashed password
    const isMatch = await comparePassword(req.body.password,result.rows[0].hashed_password);
    if(!isMatch){
        return res.status(StatusCodes.UNAUTHORIZED)
               .json({message:"Authentication Failed"});
    }
    global.user_id = result.rows[0].id //findUser.email;
        return res.status(StatusCodes.OK)
                  .json({message:"Success" , name: result.rows[0].name, email: result.rows[0].email}); 
};

function logoff(req,res){
    global.user_id = null;
    return res.sendStatus(StatusCodes.OK);

};

module.exports={register,logon,logoff};
