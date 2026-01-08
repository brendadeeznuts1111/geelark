console.log('Hello from index.js!');
console.log('Bun is running JavaScript successfully');

// Test some JavaScript features
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log('Doubled numbers:', doubled);

console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Bun version:', typeof Bun !== 'undefined' ? Bun.version : 'N/A');
