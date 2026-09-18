export type AuthRouteState = {
  authenticated: boolean;
  hasActiveMembership: boolean;
};

export function resolveAuthRoute(state: AuthRouteState) {
  if (!state.authenticated) {
    return "/sign-in";
  }

  if (!state.hasActiveMembership) {
    return "/onboarding";
  }

  return "/dashboard";
}
