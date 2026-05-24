const express = require("express");

const router = express.Router();
const { getUserAnalytics,getUsersWithStats,searchTasks } = require("../controllers/analyticsController");

router.route("/users/:id").get(getUserAnalytics);  //User analytics with groupBy operations
router.route("/users").get(getUsersWithStats);   //Users with stats and pagination
router.route("/tasks/search").get(searchTasks);  //Task search with raw SQL

module.exports = router;