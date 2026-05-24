const express = require("express");

const router = express.Router();
const { register,logon,logoff,show } = require("../controllers/userController");

router.route("/register").post(register);  //User registration with WelcomeTasks 
router.route("/logon").post(logon); //User logon
router.route("/logoff").post(logoff); //User logoff
router.route("/:id").get(show);

module.exports = router;