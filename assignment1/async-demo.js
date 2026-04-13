const fs = require('fs');
const path = require('path');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}
const filePath = path.join(sampleFilesDir,'sample.txt');


// Write a sample file for demonstration

const fileContent ="Hello, async world!";
fs.writeFile(filePath,fileContent,'utf8',(err) => {
  if (err) {
    console.error("Error Writing file:", err);
    return;
  }
}); 


// 1. Callback style

fs.readFile(filePath,'utf8',(err,data) => {
  if(err){
    console.error(err);
    return;
  }
  console.log("Callback read:", data);
});

  // Callback hell example (test and leave it in comments):
 /*
  console.log("Callback hell example");
  fs.readFile(filePath,"utf8",(err,data1) => {
     if(err)
       return console.error(err);
     console.log('Content1: ',data1);
     fs.readFile(filePath,"utf8",(err,data2) => {
       if(err)
        return console.error(err);
      console.log('Content2: ',data2);
      fs.readFile(filePath,"utf8",(err,data3) => {
        if(err)
        return console.error(err);
      console.log('Content3: ',data3);
      console.log("All files read successfully");
      })
     })
  })
     //1.Deeply nested code is difficult to modify.
     //2.Proper error handling across different nested layers becomes complex.
     //3.Understanding the flow of the execution becomes complex.
     //4.Hard to debug as the number of nested callbacks grows.
      */

  // 2. Promise style
   
  fs.promises.readFile(filePath,'utf8')
    .then(data => {
      console.log("Promise read:",data);
    }) 
    .catch(error => {
       console.error(error);
    })
       

      // 3. Async/Await style

  async function readFileAsyncAwait(){
     try{
      const data = await fs.promises.readFile(filePath,'utf8');
      console.log("Async/Await read:", data);    
     }
     catch(error){
      console.error(error);
     }
   }
   readFileAsyncAwait();
 