import { z } from "zod";

/**
 * Zod schemas for the public board read API responses. The board exposes
 * GET /api/categories and GET /api/resources as unauthenticated reads, so
 * these are external-data ingestion points and must be validated.
 */

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

export const ResourceSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  category: CategorySchema,
});

export const CategoriesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(CategorySchema),
});

export const ResourcesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ResourceSchema),
});

export type Category = z.infer<typeof CategorySchema>;
export type Resource = z.infer<typeof ResourceSchema>;
