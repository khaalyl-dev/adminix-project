"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = exports.BadRequestException = exports.NotFoundException = exports.InternalServerException = exports.HttpException = exports.AppError = void 0;
const http_config_1 = require("../config/http.config");
const error_code_enum_1 = require("../enums/error-code.enum");
// Base class for application errors, extending the built-in Error class
// Provides a standardized structure for handling errors with a status code and optional error code
class AppError extends Error {
    constructor(message, statusCode = http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR, errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Represents an HTTP-related error, extending AppError.
// Used for general HTTP exceptions with customizable status code and error code.
class HttpException extends AppError {
    constructor(message = "Http Exception Error", statusCode, errorCode) {
        super(message, statusCode, errorCode);
    }
}
exports.HttpException = HttpException;
// Represents an internal server error (500)
// Provides a default message and error code for consistency
class InternalServerException extends AppError {
    constructor(message = "Internal Server Error", errorCode) {
        super(message, http_config_1.HTTPSTATUS.INTERNAL_SERVER_ERROR, errorCode || error_code_enum_1.ErrorCodeEnum.INTERNAL_SERVER_ERROR);
    }
}
exports.InternalServerException = InternalServerException;
// Represents a "Not Found" (404) error when a requested resource is not available.
// Defaults to a generic message and error code if none are provided.
class NotFoundException extends AppError {
    constructor(message = "Resource not found", errorCode) {
        super(message, http_config_1.HTTPSTATUS.NOT_FOUND, errorCode || error_code_enum_1.ErrorCodeEnum.RESOURCE_NOT_FOUND);
    }
}
exports.NotFoundException = NotFoundException;
// Represents a "Bad Request" (400) error, typically used for validation failures.
// Defaults to a standard validation error code
class BadRequestException extends AppError {
    constructor(message = "Bad Request", errorCode) {
        super(message, http_config_1.HTTPSTATUS.BAD_REQUEST, errorCode || error_code_enum_1.ErrorCodeEnum.VALIDATION_ERROR);
    }
}
exports.BadRequestException = BadRequestException;
// Represents an "Unauthorized" (401) error, indicating authentication failure.
// Defaults to an access unauthorized error code    
class UnauthorizedException extends AppError {
    constructor(message = "Unauthorized", errorCode) {
        super(message, http_config_1.HTTPSTATUS.UNAUTHORIZED, errorCode || error_code_enum_1.ErrorCodeEnum.ACCESS_UNAUTHORIZED);
    }
}
exports.UnauthorizedException = UnauthorizedException;
