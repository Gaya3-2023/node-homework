const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", (message) => {
  console.log("Time receieved:",message);
});

setInterval(() => {
    const currentDate= new Date();
    const currentTime = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
    emitter.emit("time",currentTime);
  },5000);   


emitter.on("error", (error) => {  
  console.log("The emitter reported an error.", error.message);
});

module.exports = emitter;