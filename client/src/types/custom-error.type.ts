// custom-error.type.ts
// This file defines a custom error type for handling API and application errors in a structured way.
export interface CustomError extends Error {
    errorCode?:string; 
}