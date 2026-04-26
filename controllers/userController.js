const { StatusCodes } = require("http-status-codes");

function register(req,res){
   const newUser = {...req.body}; 
   console.log(newUser);
    global.users.push(newUser);
    global.user_id = newUser;  
    delete req.body.password;
    return  res.status(StatusCodes.CREATED)
       .json({message: "User Created", user:req.body});     
  }

function logon(req,res){
    console.log(req.body);
    const findUser = global.users.find((user) => user.email === req.body.email);
    console.log(findUser);
    if(!findUser){
        return res.status(StatusCodes.UNAUTHORIZED)
                  .json({message:"Authentication Failed"});   
    }
    
    if(req.body.password === findUser.password){
        global.user_id= findUser;
        return res.status(StatusCodes.OK)
                  .json({message:"Success" , name: findUser.name, email: findUser.email}); 
    }
    else
    {
     return res.status(StatusCodes.UNAUTHORIZED)
               .json({message:"Authentication Failed"});
    }
    

}
function logoff(req,res){
    global.user_id = null;
    return res.sendStatus(StatusCodes.OK);

}

module.exports={register,logon,logoff};
