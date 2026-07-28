/** Application-wide user roles for RBAC */
export const UserRole = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/** Roles that have admin panel access */
export const ADMIN_ROLES: UserRoleType[] = [UserRole.ADMIN];
