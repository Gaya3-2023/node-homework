# Node.js Fundamentals

## What is Node.js?
Node.js is a free, open-source runtime environment that allows JavaScript to run outside of a web browser. It is commonly used to build back-end services.

Node.js uses an event-driven, non-blocking I/O model, which means it can handle many operations at the same time without waiting for one task to finish before starting another. This makes it highly efficient and scalable.

It also uses asynchronous programming, allowing it to continue executing code while waiting for tasks like reading files or querying a database to complete.


## How does Node.js differ from running JavaScript in the browser?
JavaScript Browser:
1. JS runs in a strict,security-oriented sandbox,a protected area that blocks off various functions. Even "sandboxed" environments(e.g. Web Workers or Service Workers) have restricted APIs.
2. Runs in browser.
3. Client side application.
4. Used to control and interact with browser UI(DOM).
5. Use ES Modules(import/export).
6. Can't safely store secrets. Ex: There is no place to store a credential on a browser front end.
7. No arbitrary file-system I/O(There is now a File System Access API,but it is gated behind permissions and not universally available).
8. console.log() statements will appear in DevTools-> console.
9. Interacts with DOM or web platform.
10. Access to the window and document objects, and through them have access to DOM.
11. Can do HTTP/fetch,Web Sockets,Server-sent Events,WebRTC,etc., but cannot open raw TCP or UDP sockets.
12. Can't start program in command-line arguments.
13. Provides global objects like window,document,navigator and location that are used to interact with the web page and browser enviornment.

Node.js:
1. Node has no sandbox like browsers and has direct access to system resources.That locally runs on any machine, instead of browser.
2. Runs on your machine via the terminal/REPL(Read Evaluate Print Loop).
3. Server Side application.
4. No GUI.
5. Uses CJS Style. Use require to imports and module.exports for function exports. Node will also use ESM style but we need to specify the extension as .mjs.
6. Can safely store secrets as it is server side. It can keep credentials(e.g via environment variables,.env files,vaults).
7. Full File system module access.
8. console.log() statements will appear in terminal.
9. No DOM, API via modules(filesystem).
10. No Document,No Window and no DOM.
11. Can Open a Web server Socket.Can open TCP/UDP sockets,start HTTP servers,run WebSocket servers,etc.,
12. Starting the program in command-line arguments and reading input from or writing output to a terminal session.
13. Provides global objects like global,process and Buffer,along with built-in modules such as fs,net and http for working with the system,files and network.


## What is the V8 engine, and how does Node use it?
The V8 engine is Google's open-source JavaScript engine, used by Chrome and Node.js. It is a core component of Node.js that executes JavaScript code. It complies JavaScript code directly into machine code to improve performance and execution speed.

Key benefits of V8 in Node.js:
- Fast Code Execution: Uses Just-In-Time(JIT) compilation to convert JavaScript into machine code for high performance.
- Efficient memory management:Includes a garbage collector that automatically frees unused memory.
- Supports Asynchronous processing- Works with Node.js’s non-blocking architecture to handle multiple tasks efficiently.
- Cross-platform compatibility- Allows Node.js applications to run across platforms like Windows, Linux, and macOS.
- Inline Caching-Speeds up property access by remembering where to find object properties.

## What are some key use cases for Node.js?
 1. Commonly used to building APIs.
 2. Real-time applications such as chat applications,online games and collaborative tools because it supports fast,two-way 
commnunication using WebSockets.
 3. Streaming applications - ideal for streaming audio,video or large files efficiently because it processes data in chunks.
 4. Microservices - works well for microservices,where an application is divided into small,independent services that handle specific tasks.
 5. Command-line tools:Node.js allows building a powerful CLI tool using npom libraries and cross-platform support.
 6. Single-Page Applications(SPAs): Supports dynamic content loading without full page reloads,enhancing user experience.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

1. One of the primary differences lies in the syntax used to import and export modules:
   - CommonJS:
     const myModule = require('./myModule') // Import
     module.exports = myFunction; //export
   - ES Modules:
     import myFunction from './myModule.js'; //Import
     export default myFunction; //Export

2. CommonJS uses synchronous loading,which means that modules are loaded one after another,blocking the execution
of code while waiting for a module to be fully loaded. This is suitable for server-side applications where speed isn't an
immediate concern.
   ES Modules allow for asynchronous loading. This is especially benefical for web applications,where non-blocking behavior can lead to better performance and user experience.

3. CommonJS does not require a file extension when importing modules.
   ES Modules require the use of a file extension like '.js' or '.mjs' in import statements. 


**CommonJS (default in Node.js):**
```js
math.js:

function add(a,b){
  return a+b;
}
function multiply(a,b){
  return a*b;
}
module.exports={add,multiply};

app.js:

const{add,multiply} = require('./math');
const a=5;
const b=6;
console.log(`Add Output : ${add(a,b)}`); //Add Output: 11;
console.log(`Multiply Output: ${multiply(a,b)}`); //Multiply Output: 30;

```

**ES Modules (supported in modern Node.js):**
```js
math.js:

export function add(a,b){
 return a+b;
}
export function multiply(a,b){
  return a*b;
}

app.js:

import {add,multiply} from './math.js';
const a =5;
const b=6;
console.log(`Add Output : ${add(a,b)}`); //Add Output: 11;
console.log(`Multiply Output: ${multiply(a,b)}`); //Multiply Output: 30;

``` 