import type { DatabaseReader, MutationCtx } from "../_generated/server";
import { generateId } from "./ids";

const permissionKeys = [
  "member_add",
  "member_delete",
  "member_role_change",
  "task_create",
  "task_update",
  "task_delete",
  "chores_complete",
  "chores_delete",
  "calendar_create",
  "calendar_update",
  "calendar_delete",
  "shopping_add",
  "shopping_update",
  "shopping_delete",
  "meal_create",
  "meal_update",
  "meal_delete",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];

export type HouseholdRole = "admin" | "adult" | "child";

type RolePermissionSeed = {
  role: HouseholdRole;
  permission: PermissionKey;
  allowed: boolean;
};

export const ROLE_PERMISSION_SEEDS: RolePermissionSeed[] = [
  // admin: allow all
  { role: "admin", permission: "member_add", allowed: true },
  { role: "admin", permission: "member_delete", allowed: true },
  { role: "admin", permission: "member_role_change", allowed: true },
  { role: "admin", permission: "task_create", allowed: true },
  { role: "admin", permission: "task_update", allowed: true },
  { role: "admin", permission: "task_delete", allowed: true },
  { role: "admin", permission: "chores_complete", allowed: true },
  { role: "admin", permission: "chores_delete", allowed: true },
  { role: "admin", permission: "calendar_create", allowed: true },
  { role: "admin", permission: "calendar_update", allowed: true },
  { role: "admin", permission: "calendar_delete", allowed: true },
  { role: "admin", permission: "shopping_add", allowed: true },
  { role: "admin", permission: "shopping_update", allowed: true },
  { role: "admin", permission: "shopping_delete", allowed: true },
  { role: "admin", permission: "meal_create", allowed: true },
  { role: "admin", permission: "meal_update", allowed: true },
  { role: "admin", permission: "meal_delete", allowed: true },
  // adult: management without member delete/role change
  { role: "adult", permission: "member_add", allowed: true },
  { role: "adult", permission: "member_delete", allowed: false },
  { role: "adult", permission: "member_role_change", allowed: false },
  { role: "adult", permission: "task_create", allowed: true },
  { role: "adult", permission: "task_update", allowed: true },
  { role: "adult", permission: "task_delete", allowed: true },
  { role: "adult", permission: "chores_complete", allowed: true },
  { role: "adult", permission: "chores_delete", allowed: true },
  { role: "adult", permission: "calendar_create", allowed: true },
  { role: "adult", permission: "calendar_update", allowed: true },
  { role: "adult", permission: "calendar_delete", allowed: true },
  { role: "adult", permission: "shopping_add", allowed: true },
  { role: "adult", permission: "shopping_update", allowed: true },
  { role: "adult", permission: "shopping_delete", allowed: true },
  { role: "adult", permission: "meal_create", allowed: true },
  { role: "adult", permission: "meal_update", allowed: true },
  { role: "adult", permission: "meal_delete", allowed: true },
  // child: limited
  { role: "child", permission: "member_add", allowed: false },
  { role: "child", permission: "member_delete", allowed: false },
  { role: "child", permission: "member_role_change", allowed: false },
  { role: "child", permission: "task_create", allowed: false },
  { role: "child", permission: "task_update", allowed: false },
  { role: "child", permission: "task_delete", allowed: false },
  { role: "child", permission: "chores_complete", allowed: true },
  { role: "child", permission: "chores_delete", allowed: false },
  { role: "child", permission: "calendar_create", allowed: true },
  { role: "child", permission: "calendar_update", allowed: true },
  { role: "child", permission: "calendar_delete", allowed: true },
  { role: "child", permission: "shopping_add", allowed: true },
  { role: "child", permission: "shopping_update", allowed: true },
  { role: "child", permission: "shopping_delete", allowed: false },
  { role: "child", permission: "meal_create", allowed: false },
  { role: "child", permission: "meal_update", allowed: false },
  { role: "child", permission: "meal_delete", allowed: false },
];

type RolePermissionDefaults = Array<{
  permission: PermissionKey;
  allowed: boolean;
}>;

export function getRolePermissionSeedsForRole(
  role: HouseholdRole
): RolePermissionDefaults {
  return ROLE_PERMISSION_SEEDS.filter((seed) => seed.role === role).map(
    (seed) => ({ permission: seed.permission, allowed: seed.allowed })
  );
}

export async function ensureRolePermissions(
  ctx: MutationCtx
): Promise<number> {
  let insertedCount = 0;
  const now = Date.now();

  for (const seed of ROLE_PERMISSION_SEEDS) {
    const existing = await ctx.db
      .query("rolePermissions")
      .withIndex("by_role_permission", (q) =>
        q.eq("role", seed.role).eq("permission", seed.permission)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("rolePermissions", {
        id: generateId(),
        role: seed.role,
        permission: seed.permission,
        allowed: seed.allowed,
        createdAt: now,
        updatedAt: now,
      });
      insertedCount += 1;
    }
  }

  return insertedCount;
}

export async function getRolePermissionsForRole(
  ctx: { db: DatabaseReader },
  role: HouseholdRole
): Promise<RolePermissionDefaults> {
  const rolePermissions = await ctx.db
    .query("rolePermissions")
    .withIndex("by_role", (q) => q.eq("role", role))
    .collect();

  if (rolePermissions.length === 0) {
    return getRolePermissionSeedsForRole(role);
  }

  return rolePermissions.map((permission) => ({
    permission: permission.permission,
    allowed: permission.allowed,
  }));
}

export async function ensureMemberPermissionsForRole(
  ctx: MutationCtx,
  memberId: string,
  role: HouseholdRole
): Promise<number> {
  const roleDefaults = await getRolePermissionsForRole(ctx, role);
  const now = Date.now();
  let insertedCount = 0;

  for (const permissionDefault of roleDefaults) {
    const existing = await ctx.db
      .query("memberPermissions")
      .withIndex("by_member_permission", (q) =>
        q.eq("memberId", memberId).eq("permission", permissionDefault.permission)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("memberPermissions", {
        id: generateId(),
        memberId,
        permission: permissionDefault.permission,
        allowed: permissionDefault.allowed,
        createdAt: now,
        updatedAt: now,
      });
      insertedCount += 1;
    }
  }

  return insertedCount;
}
