"use server";

import { redirect } from "next/navigation";
import { requireUser } from "../auth/session";
import { createServerSupabaseClient } from "../supabase/server";
import { parseWorkspaceInput } from "./validation";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function onboardingError(message: string): never {
  redirect(`/onboarding?error=${encodeURIComponent(message)}`);
}

export async function createWorkspace(formData: FormData) {
  const user = await requireUser();

  let input;
  try {
    input = parseWorkspaceInput({
      name: field(formData, "name"),
      slug: field(formData, "slug"),
    });
  } catch {
    onboardingError(
      "Enter an institute name and a lowercase slug such as bright-path-academy.",
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("institutes").insert({
    name: input.name,
    slug: input.slug,
    created_by: user.id,
  });

  if (error?.code === "23505") {
    onboardingError("That workspace slug is already in use.");
  }

  if (error) {
    onboardingError("We could not create the workspace. Please try again.");
  }

  redirect("/dashboard");
}
