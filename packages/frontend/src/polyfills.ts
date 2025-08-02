// Polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer available globally
(window as any).Buffer = Buffer;

// Make process available globally
(window as any).process = process;

// Set up global object for Node.js compatibility
if (typeof global === 'undefined') {
  (window as any).global = window;
} 