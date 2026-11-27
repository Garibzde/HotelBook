import { z } from "zod";
import { paginationQuerySchema } from "./common.schema.js";

export const createHotelSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  city: z.string().trim().min(2, "City must be at least 2 characters").max(80),
  address: z.string().trim().min(5, "Address must be at least 5 characters").max(200),
  description: z.string().trim().max(2000).optional(),
  stars: z.number().int().min(1, "Stars must be between 1 and 5").max(5, "Stars must be between 1 and 5"),
  phone: z.string().trim().max(30).optional(),
});

export const updateHotelSchema = createHotelSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const hotelStatusSchema = z.object({
  isActive: z.boolean(),
});

export const listHotelsQuerySchema = paginationQuerySchema.extend({
  city: z.string().trim().min(1).optional(),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(["name", "stars", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;
export type ListHotelsQuery = z.infer<typeof listHotelsQuerySchema>;