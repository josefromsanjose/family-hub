import { describe, expect, it } from "vitest";
import {
  ROLE_PERMISSION_SEEDS,
  ensureMemberPermissionsForRole,
  ensureRolePermissions,
  getRolePermissionSeedsForRole,
} from "./permissions";

type RolePermission = {
  id: string;
  role: "admin" | "adult" | "child";
  permission: string;
  allowed: boolean;
};

type MemberPermission = {
  id: string;
  memberId: string;
  permission: string;
  allowed: boolean;
};

type IndexQueryBuilder<TField extends string> = {
  eq: (field: TField, value: string) => IndexQueryBuilder<TField>;
};

type RolePermissionsQuery = {
  withIndex: {
    (
      index: "by_role_permission",
      builder: (q: IndexQueryBuilder<"role" | "permission">) => unknown
    ): { first: () => Promise<{ _id: string } | null> };
    (
      index: "by_role",
      builder: (q: IndexQueryBuilder<"role">) => unknown
    ): {
      collect: () => Promise<Array<{ permission: string; allowed: boolean }>>;
    };
  };
};

type MemberPermissionsQuery = {
  withIndex: (
    index: "by_member_permission",
    builder: (q: IndexQueryBuilder<"memberId" | "permission">) => unknown
  ) => { first: () => Promise<{ _id: string } | null> };
};

type MockDb = {
  query: {
    (table: "rolePermissions"): RolePermissionsQuery;
    (table: "memberPermissions"): MemberPermissionsQuery;
  };
  insert: (
    table: "rolePermissions" | "memberPermissions",
    value: RolePermission | MemberPermission
  ) => Promise<string>;
};

const createMockContext = () => {
  const rolePermissions: RolePermission[] = [];
  const memberPermissions: MemberPermission[] = [];

  const filterRows = (
    rows: Array<Record<string, unknown>>,
    criteria: Record<string, unknown>
  ) =>
    rows.filter((row) =>
      Object.entries(criteria).every(([key, value]) => row[key] === value)
    );

  const createQueryBuilder = () => {
    const criteria: Record<string, unknown> = {};
    const builder: IndexQueryBuilder<string> = {
      eq: (field: string, value: string) => {
        criteria[field] = value;
        return builder;
      },
    };
    return { criteria, builder };
  };

  const db: MockDb = {
    query: ((table: "rolePermissions" | "memberPermissions") => {
      if (table === "rolePermissions") {
        return {
          withIndex: ((index, builder) => {
            const { criteria, builder: q } = createQueryBuilder();
            builder(q as IndexQueryBuilder<"role" | "permission">);

            const matches = filterRows(rolePermissions, criteria);
            if (index === "by_role") {
              return {
                collect: async () =>
                  matches.map((match) => ({
                    permission: String(match.permission),
                    allowed: Boolean(match.allowed),
                  })),
              };
            }

            return {
              first: async () => (matches[0] ? { _id: "mock-id" } : null),
            };
          }) as RolePermissionsQuery["withIndex"],
        };
      }

      return {
        withIndex: ((_, builder) => {
          const { criteria, builder: q } = createQueryBuilder();
          builder(q as IndexQueryBuilder<"memberId" | "permission">);
          const matches = filterRows(memberPermissions, criteria);
          return {
            first: async () => (matches[0] ? { _id: "mock-id" } : null),
          };
        }) as MemberPermissionsQuery["withIndex"],
      };
    }) as MockDb["query"],
    insert: async (
      table: "rolePermissions" | "memberPermissions",
      value: RolePermission | MemberPermission
    ) => {
      if (table === "rolePermissions") {
        rolePermissions.push(value as RolePermission);
      } else {
        memberPermissions.push(value as MemberPermission);
      }
      return value.id;
    },
  };

  return { db, rolePermissions, memberPermissions };
};

describe("permissions seed helpers", () => {
  it("inserts missing role permissions idempotently", async () => {
    const ctx = createMockContext();

    const roleSeedContext =
      ctx as unknown as Parameters<typeof ensureRolePermissions>[0];
    const firstInsert = await ensureRolePermissions(roleSeedContext);
    const secondInsert = await ensureRolePermissions(roleSeedContext);

    expect(firstInsert).toBe(ROLE_PERMISSION_SEEDS.length);
    expect(secondInsert).toBe(0);
    expect(ctx.rolePermissions).toHaveLength(ROLE_PERMISSION_SEEDS.length);
  });

  it("seeds member permissions from role defaults when missing", async () => {
    const ctx = createMockContext();
    const expectedDefaults = getRolePermissionSeedsForRole("child");

    const memberSeedContext =
      ctx as unknown as Parameters<typeof ensureMemberPermissionsForRole>[0];
    const inserted = await ensureMemberPermissionsForRole(
      memberSeedContext,
      "member-1",
      "child"
    );

    expect(inserted).toBe(expectedDefaults.length);
    expect(ctx.memberPermissions).toHaveLength(expectedDefaults.length);

    const secondInsert = await ensureMemberPermissionsForRole(
      memberSeedContext,
      "member-1",
      "child"
    );
    expect(secondInsert).toBe(0);
  });

  it("uses role permissions from the table when present", async () => {
    const ctx = createMockContext();
    ctx.rolePermissions.push({
      id: "role-1",
      role: "adult",
      permission: "task_create",
      allowed: false,
    });

    const memberSeedContext =
      ctx as unknown as Parameters<typeof ensureMemberPermissionsForRole>[0];
    await ensureMemberPermissionsForRole(memberSeedContext, "member-2", "adult");

    const taskPermission = ctx.memberPermissions.find(
      (permission) => permission.permission === "task_create"
    );

    expect(taskPermission?.allowed).toBe(false);
  });
});
