const express = require("express");

const router = express.Router();
const { create,index,show,update,deleteTask,bulkCreate, bulkDelete, bulkUpdateWithIds, bulkUpdate } = require("../controllers/taskController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
router.use(jwtMiddleware);
router.route("/").get(index);  //List tasks with pagination,eager loading ,and search filter
router.route("/").post(create);  //Create single task
router.route("/bulk").post(bulkCreate);  //Bulk create tasks(createMany)
router.route("/:id").get(show);  //Show task with user Info(eager loading)
router.route("/:id").patch(update);   //update task
router.route("/:id").delete(deleteTask);  //delete task
router.route("/bulkDelete").post(bulkDelete); //bulk task deletion
router.route("/bulkUpdateWithIds").post(bulkUpdateWithIds); //bulk update with ids
router.route("/bulkUpdate").post(bulkUpdate);
module.exports = router;
