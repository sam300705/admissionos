import { redirect } from "next/navigation";
import {
  getActiveMembership,
  getOptionalUser,
} from "../lib/auth/session";
import { resolveAuthRoute } from "../lib/auth/route-decision";

export default async function HomePage() {
  const user = await getOptionalUser();
  const membership = user ? await getActiveMembership(user.id) : null;

  redirect(
    resolveAuthRoute({
      authenticated: Boolean(user),
      hasActiveMembership: Boolean(membership),
    }),
  );
}
