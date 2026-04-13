const os = require('os');
const path = require('path');
const fs = require('fs');

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}
const fileName = "largefile.txt";
const demoFile = "demo.txt";

// OS module
console.log(`Platform: ${os.platform()}`);
const cpus= os.cpus();
console.log("CPU: ",cpus[0].model);
console.log(`Total Memory:  ${os.totalmem()}`);

// Path module
 const filePath = path.join(sampleFilesDir,fileName);
 console.log("Joined path: ",filePath);

// fs.promises API
const demoFilePath = path.join(sampleFilesDir,demoFile);
const doFileOperations = async() => {
  try{
    const fileHandle = await fs.promises.open(demoFilePath,"w");
    await fileHandle.writeFile("Hello from fs.promises!");
    await fileHandle.close();

    const data = await fs.promises.readFile(demoFilePath,'utf8');
    console.log("fs.promises read: " ,data);

    }
   catch(err){
    console.log("Error Occured. ",err);
   }  
}
doFileOperations();


// Streams for large files- log first 40 chars of each chunk
const writeStream = fs.createWriteStream(filePath);
for(let i=1;i<=100;i++){
  writeStream.write(`${i} - This is a line in large file\n`);
} 
writeStream.end();

writeStream.on('error', (err) => {
  console.error('Error writing file:', err);
});

writeStream.on('finish',() =>{
const readStream = fs.createReadStream(filePath,{encoding:'utf8',highWaterMark:1024});
readStream.on('data',(chunk) => {
  console.log('Read chunk:' ,chunk.slice(0,40));
});
readStream.on('end',() => {
  console.log('Finished reading large file with streams.');
})
})
