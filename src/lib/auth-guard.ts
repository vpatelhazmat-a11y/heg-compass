/** Fail closed when identity or approved membership cannot be verified. */
export function hasApprovedAccess(
  userId: string | null,
  active: boolean | null,
  roles: readonly string[],
) {
  return Boolean(
    userId &&
    active &&
    roles.some((role) =>
      ["admin", "sales", "operations", "safety", "management", "read_only"].includes(role),
    ),
  );
}
