const express = require("express");

const router = express.Router();
const { create,index,show,update,deleteTask,bulkCreate } = require("../controllers/taskController");

router.route("/").get(index);  //List tasks with pagination,eager loading ,and search filter
router.route("/").post(create);  //Create single task
router.route("/bulk").post(bulkCreate);  //Bulk create tasks(createMany)
router.route("/:id").get(show);  //Show task with user Info(eager loading)
router.route("/:id").patch(update);   //update task
router.route("/:id").delete(deleteTask);  //delete task


module.exports = router;
