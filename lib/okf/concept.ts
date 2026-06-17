import { z } from "zod";
import { conceptSlug } from "./slug";

/**
 * Canonical OKF v0.1 concept model for a curated link. This is the single
 * source of truth for what "a resource is valid OKF" means: every write path
 * builds and validates a concept here BEFORE anything touches the database.
 */

export { conceptSlug, slugify } from "./slug";

export const OkfConceptSchema = z.object({
  type: z.literal("Link"),
  title: z.string().min(1).max(500),
  description: z.string().max(1000).nullable(),
  resource: z.string().url(),
  categorySlug: z.string().min(1),
  tags: z.array(z.string().min(1)),
  slug: z.string().min(1),
  timestamp: z.string().optional(),
});

export type OkfConcept = z.infer<typeof OkfConceptSchema>;

export type BuildConceptInput = {
  url: string;
  title: string;
  description?: string | null;
  categorySlug: string;
  tags?: string[];
};

/**
 * Assemble a raw link into a validated OKF concept. Returns a discriminated
 * result so callers can reject invalid input before persisting.
 */
export function buildOkfConcept(
  input: BuildConceptInput,
): { ok: true; concept: OkfConcept } | { ok: false; error: z.ZodError } {
  const candidate: OkfConcept = {
    type: "Link",
    title: input.title,
    description: input.description ?? null,
    resource: input.url,
    categorySlug: input.categorySlug,
    tags: input.tags && input.tags.length > 0 ? input.tags : [input.categorySlug],
    slug: conceptSlug(input.title, input.url),
  };

  const parsed = OkfConceptSchema.safeParse(candidate);
  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, concept: parsed.data };
}
