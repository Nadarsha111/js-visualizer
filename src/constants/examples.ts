export const EXAMPLES = [
  {
    id: "closure",
    title: "Closure",
    description:
      "Demonstrates how a function retains access to variables from its outer scope.",
    code: `function outer() {
  let count = 0;
  function inner() {
    count++;
    return count;
  }
  return inner;
}

const counter = outer();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3`,
  },
  {
    id: "event-loop",
    title: "Event Loop (setTimeout)",
    description:
      "Visualizes how setTimeout callbacks are handled by the Task Queue.",
    code: `console.log('Start');

setTimeout(() => {
  console.log('Timeout callback');
}, 0);

console.log('End');`,
  },
  {
    id: "hoisting",
    title: "Hoisting",
    description:
      "Shows the difference between var, let, and const hoisting behavior.",
    code: `console.log(x); // undefined
var x = 5;

// console.log(y); // ReferenceError
let y = 10;

function test() {
  console.log('Function hoisted');
}
test();`,
  },
  {
    id: "scope-chain",
    title: "Scope Chain",
    description:
      "Visualizes how variables are looked up through the scope chain.",
    code: `const globalVar = 'Global';

function outer() {
  const outerVar = 'Outer';
  
  function inner() {
    const innerVar = 'Inner';
    console.log(innerVar);
    console.log(outerVar);
    console.log(globalVar);
  }
  
  inner();
}

outer();`,
  },
  {
    id: "promise-all",
    title: "Promise.all & fetch",
    description: "Visualizes Promise.all with fetch requests and chaining.",
    code: `const GOOGLE = 'https://www.google.com';
const NEWS = 'https://www.news.google.com';

console.log('Start');

/* b, c, after */
Promise.all([
  fetch(GOOGLE).then(function b() {
    console.log('b done');
  }),
  fetch(GOOGLE).then(function c() {
    console.log('c done');
  }),
]).then(function after() {
  console.log('All done');
});

console.log('End');`,
  },
];
