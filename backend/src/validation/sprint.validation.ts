// Validation schema and logic for sprint-related API requests.
import { z } from "zod";

export const sprintNameSchema = z.string().trim().min(1).max(255);
export const sprintDescriptionSchema = z.string().trim().optional();
export const sprintNumberSchema = z.number().int().min(1);
export const sprintCapacitySchema = z.number().int().min(1).max(200);
export const sprintStatusSchema = z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']);

export const startDateSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => {
      return !val || !isNaN(Date.parse(val));
    },
    {
      message: "Invalid start date format. Please provide a valid date string.",
    }
  );

export const endDateSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => {
      return !val || !isNaN(Date.parse(val));
    },
    {
      message: "Invalid end date format. Please provide a valid date string.",
    }
  );

export const sprintIdSchema = z.string().trim().min(1);

export const createSprintSchema = z.object({
  name: sprintNameSchema,
  description: sprintDescriptionSchema,
  sprintNumber: sprintNumberSchema,
  startDate: startDateSchema,
  endDate: endDateSchema,
  capacity: sprintCapacitySchema.optional(),
  status: sprintStatusSchema.optional(),
});

export const updateSprintSchema = z.object({
  name: sprintNameSchema.optional(),
  description: sprintDescriptionSchema,
  startDate: startDateSchema,
  endDate: endDateSchema,
  capacity: sprintCapacitySchema.optional(),
  status: sprintStatusSchema.optional(),
}); 