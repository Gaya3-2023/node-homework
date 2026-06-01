const express = require("express");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = express.Router();
const { register,logon,logoff,show } = require("../controllers/userController");

router.route("/register").post(register);  //User registration with WelcomeTasks 
router.route("/logon").post(logon); //User logon
router.route("/:id").get(show);
router.use(jwtMiddleware);
router.route("/logoff").post(logoff); //User logoff


module.exports = router;