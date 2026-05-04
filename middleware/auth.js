module.exports = (req,res,next) =>{
    if(global.user_id !== null)
       return next();
    else{
      return res.status(401).json({ message : "unauthorized" });
                 
    }
};