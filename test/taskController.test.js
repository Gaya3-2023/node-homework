require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // point to the test database!
const prisma = require("../db/prisma");
//const httpMocks = require("node-mocks-http");
const httpMocks = require("node-mocks-http");
const EventEmitter = require("events");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({data: { name: "Bob", 
    email: "bob@sample.com", hashedPassword: "nonsense"}});
  user2 = await prisma.User.create({data: { name: "Alice", 
    email: "alice@sample.com", hashedPassword: "nonsense"}});
});



describe("testing task creation", () => {
  it("14. Creates a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});;
    expect.assertions(1);
    // be sure you pass the event emitter class
    try{
    await waitForRouteHandlerCompletion(create,req, saveRes);
    // expect(saveRes.statusCode).toBe(201);
    }
    catch(e){
      expect(e.name).toBe("TypeError");
    }
  });
  /*15.You can't create a task with a bogus user id*/
  it("15. You can't create a task with a bogus user id", async() => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: 73456 };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    try{
     await waitForRouteHandlerCompletion(create,req, saveRes);    
    }
    catch(e){
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }

  });
  /*16.If you have a valid user id, create() succeeds (res.statusCode should be 201).*/
  it("16. If you have a valid user id, create() succeeds (res.statusCode should be 201).", async () => {
    
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});;
    await waitForRouteHandlerCompletion(create,req, saveRes);
    expect(saveRes.statusCode).toBe(201);    

  });
  /*17. The object returned from the create() call has hte expected title.*/
  it("17.The object returned from the create() call has the expected title.",() => {
     saveData = saveRes._getJSONData();
     saveTaskId = saveData.id.toString();
     expect(saveData.title).toBe("first task");
  });
  /*The object has the right value for isCompleted.*/
  it("18.The object has the right value for isCompleted.",() => {
      expect(saveData.isCompleted).toBe(false);
  });
  /*The object does not have any value for userId.*/
  it("19. The object does not have any value for userId.",() =>{
      expect(saveData.userId).not.toBeDefined();
  });
 })

 describe("test getting created tasks", () => {
  /*20. You can't get a list of tasks without a user id.*/
  it("20. You can't get a list of tasks without a user id.",async () =>{
     const req = httpMocks.createRequest({
      method: "GET",
    });
    try{
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(index,req, saveRes);
    expect(saveRes.statusCode).toBe(200);
    }
    catch(e){
      expect(e.name).toBe("TypeError");
    }
  });
  /*21.  If you use user1's id, the call returns a 200 status.*/
  it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
    
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };    
    saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
    await waitForRouteHandlerCompletion(index,req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  
  /*22. The returned object has a tasks array of length 1.*/
    it("22. The returned object has a tasks array of length 1.", async () => {
    saveData = saveRes._getJSONData(); // reusing saveRes
    expect(saveData.tasks.length).toBe(1);
  });
  /*23. The title in the first array object is as expected.*/
  it("23. The title in the first array object is as expected.",()=> {
     expect(saveData.tasks[0].title).toBe("first task");
  });
  /*24. The first array object does not contain a userId.*/
  it("24.  The first array object does not contain a userId.",() =>{
    expect(saveData.tasks[0].userId).not.toBeDefined();
  });
  /*25.  If you get the list of tasks using the userId from user2, you get a 404.*/
  it("25.  If you get the list of tasks using the userId from user2, you get a 404.", async () =>{
      const req = httpMocks.createRequest({
          method: "GET",
        });       
       req.user = { id: user2.id };      
       saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter});
       await waitForRouteHandlerCompletion(index, req, saveRes);
       expect(saveRes.statusCode).toBe(404);
  });
  /*26 . You can retrieve the created task using show().*/
  it("26.You can retrieve the created task using show().",async () =>{
     const req = httpMocks.createRequest({
          method: "GET",
        });
        req.user = { id: user1.id };
        req.params = { id: saveTaskId.toString() };
        saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
        await waitForRouteHandlerCompletion(show,req, saveRes);
        expect(saveRes.statusCode).toBe(200);
  });
  /*27.User2 can't retrieve this task entry. You should get a 404.*/
  it("27.User2 can't retrieve this task entry. You should get a 404.",async () => {
     const req = httpMocks.createRequest({
          method: "GET",
        });
      req.user = { id: user2.id };
      req.params = {id: saveTaskId.toString()};
       saveRes = httpMocks.createResponse({eventEmitter: EventEmitter});
       await waitForRouteHandlerCompletion(show,req, saveRes);
       expect(saveRes.statusCode).toBe(404);
  });
 
 });

 describe("testing the update and delete of tasks",() => {
  /*28.User1 can set the task corresponding to saveTaskId to isCompleted: true.*/
  it("28.User1 can set the task corresponding to saveTaskId to isCompleted: true.",async () => {
     const req = httpMocks.createRequest({
          method: "PATCH",
        });
        req.user = {id: user1.id};
        req.params = { id: saveTaskId };
        req.body = { isCompleted: true };
        saveRes = httpMocks.createResponse({eventEmitter : EventEmitter});
        await waitForRouteHandlerCompletion(update,req, saveRes);
        expect(saveRes.statusCode).toBe(200);
  });
  /*29.User2 can't do this.*/
  it("29. User2 can't do this.",async () =>{
     const req = httpMocks.createRequest({
          method: "PATCH",
     });
        req.user = {id: user2.id};
        req.params = { id: saveTaskId };
        req.body = { isCompleted: true };
        saveRes = httpMocks.createResponse({eventEmitter : EventEmitter});
        await waitForRouteHandlerCompletion(update, req, saveRes);
        expect(saveRes.statusCode).toBe(404);
  });
  /*30.  User2 can't delete this task.*/
  it("30.  User2 can't delete this task.",async () =>{
    const req = httpMocks.createRequest({
          method: "DELETE",
     });
     req.user = {id: user2.id};
     req.params = {id: saveTaskId};
     saveRes = httpMocks.createResponse({eventEmitter : EventEmitter});
     await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
     expect(saveRes.statusCode).toBe(404);

  });
  /*31. User1 can delete this task.*/
  it("31. User1 can delete this task.",async () => {
    const req = httpMocks.createRequest({
          method: "DELETE",
     });
     req.user = {id: user1.id};
     req.params = {id: saveTaskId};
     saveRes = httpMocks.createResponse({eventEmitter : EventEmitter});
     await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
     expect(saveRes.statusCode).toBe(200);

  });
  /*32 . Retrieving user1's tasks now returns a 404.*/
  it("32. Retrieving user1's tasks now returns a 404.",async() => {
     const req = httpMocks.createRequest({
          method: "GET",
     });
     req.user = {id: user1.id};
     req.params = {id: saveTaskId};
     saveRes = httpMocks.createResponse({eventEmitter : EventEmitter});
     await waitForRouteHandlerCompletion(index, req, saveRes);
     expect(saveRes.statusCode).toBe(404);
  });
 });
 
 afterAll(() => {
  prisma.$disconnect();
})