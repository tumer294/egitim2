import { EventEmitter } from 'events';

// It's important to use a single instance of EventEmitter throughout the app.
const errorEmitter = new EventEmitter();

export { errorEmitter };
