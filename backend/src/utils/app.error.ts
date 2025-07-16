import { HTTPSTATUS, HttpStatusCodeType } from "../config/http.config";
import { ErrorCodeEnum, ErrorCodeEnumType } from "../enums/error-code.enum";

// Base class for application errors, extending the built-in Error class
// Provides a standardized structure for handling errors with a status code and optional error code
export class AppError extends Error {
    public statusCode: HttpStatusCodeType
    public errorCode?:ErrorCodeEnumType;

    constructor (
        message: string,
        statusCode = HTTPSTATUS.INTERNAL_SERVER_ERROR,
        errorCode?:ErrorCodeEnumType
    ) {
        super(message)
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor); 
    }  
}
// Represents an HTTP-related error, extending AppError.
// Used for general HTTP exceptions with customizable status code and error code.
export class HttpException extends AppError {
    constructor(
        message = "Http Exception Error",
        statusCode: HttpStatusCodeType,
        errorCode?:ErrorCodeEnumType
    ) {
        super(message, statusCode, errorCode);
    }
}
// Represents an internal server error (500)
// Provides a default message and error code for consistency
export class InternalServerException extends AppError {
  constructor (
    message= "Internal Server Error",
    errorCode?:ErrorCodeEnumType
  )   {
    super(message,
         HTTPSTATUS.INTERNAL_SERVER_ERROR,
         errorCode || ErrorCodeEnum.INTERNAL_SERVER_ERROR);
  }   
} 
// Represents a "Not Found" (404) error when a requested resource is not available.
// Defaults to a generic message and error code if none are provided.
export class NotFoundException extends AppError {
    constructor(
        message = "Resource not found",
        errorCode?:ErrorCodeEnumType) {
            super(
                message,
                HTTPSTATUS.NOT_FOUND,
                errorCode || ErrorCodeEnum.RESOURCE_NOT_FOUND
            );
        }
}
// Represents a "Bad Request" (400) error, typically used for validation failures.
// Defaults to a standard validation error code
export class BadRequestException extends AppError {
    constructor(
        message = "Bad Request",
        errorCode?:ErrorCodeEnumType)
         {
            super(
                message,
                HTTPSTATUS.BAD_REQUEST,
                errorCode || ErrorCodeEnum.VALIDATION_ERROR
            );
        }
}
// Represents an "Unauthorized" (401) error, indicating authentication failure.
// Defaults to an access unauthorized error code    
export class UnauthorizedException extends AppError {
    constructor(
        message = "Unauthorized",
        errorCode?:ErrorCodeEnumType)
         {
            super(
                message,
                HTTPSTATUS.UNAUTHORIZED,
                errorCode || ErrorCodeEnum.ACCESS_UNAUTHORIZED
            );
        }
}