"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPriorityEnum = exports.TaskStatusEnum = void 0;
// Enum for task statuses and types used throughout the backend application.
exports.TaskStatusEnum = {
    BACKLOG: "BACKLOG",
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    IN_REVIEW: "IN_REVIEW",
    DONE: "DONE",
};
exports.TaskPriorityEnum = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
};
