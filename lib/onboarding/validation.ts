import { z } from "zod";

const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Institute name must be at least 2 characters")
    .max(160, "Institute name must be 160 characters or fewer"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(80, "Slug must be 80 characters or fewer")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug may contain lowercase letters, numbers, and single hyphens",
    ),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;

export function parseWorkspaceInput(input: unknown): WorkspaceInput {
  return workspaceSchema.parse(input);
}
