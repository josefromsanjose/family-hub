import { internalMutation } from "./_generated/server";
import {
  ensureMemberPermissionsForRole,
  ensureRolePermissions,
} from "./lib/permissions";

export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rolePermissionsInserted = await ensureRolePermissions(ctx);

    const members = await ctx.db.query("householdMembers").collect();
    let memberPermissionsInserted = 0;

    for (const member of members) {
      memberPermissionsInserted += await ensureMemberPermissionsForRole(
        ctx,
        member.id,
        member.role
      );
    }

    return {
      rolePermissionsInserted,
      memberPermissionsInserted,
    };
  },
});
