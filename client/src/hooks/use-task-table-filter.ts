// use-task-table-filter.ts
// This file provides a custom React hook for managing task table filters (status, priority, etc.) in the workspace.
import {
  TaskPriorityEnum,
  TaskPriorityEnumType,
  TaskStatusEnum,
  TaskStatusEnumType,
} from "@/constant";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";

const useTaskTableFilter = () => {
  return useQueryStates({
    status: parseAsStringEnum<TaskStatusEnumType>(
      Object.values(TaskStatusEnum)
    ),
    priority: parseAsStringEnum<TaskPriorityEnumType>(
      Object.values(TaskPriorityEnum)
    ),
    keyword: parseAsString,
    projectId: parseAsString,
    assigneeId: parseAsString,
    sprintId: parseAsString,
  });
};

export default useTaskTableFilter;
