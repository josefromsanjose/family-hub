import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const householdRole = v.union(
  v.literal("admin"),
  v.literal("adult"),
  v.literal("child")
);

const householdRelation = v.union(
  v.literal("parent"),
  v.literal("child"),
  v.literal("grandparent"),
  v.literal("sibling"),
  v.literal("aunt_uncle"),
  v.literal("cousin"),
  v.literal("guardian"),
  v.literal("partner"),
  v.literal("roommate"),
  v.literal("other")
);

const memberLocale = v.union(v.literal("en"), v.literal("es"));

const taskPriority = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);

const taskRecurrence = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly")
);

const taskRotationMode = v.union(
  v.literal("none"),
  v.literal("odd_even_week")
);

const permissionKey = v.union(
  v.literal("member_add"),
  v.literal("member_delete"),
  v.literal("member_role_change"),
  v.literal("task_create"),
  v.literal("task_update"),
  v.literal("task_delete"),
  v.literal("chores_complete"),
  v.literal("chores_delete"),
  v.literal("calendar_create"),
  v.literal("calendar_update"),
  v.literal("calendar_delete"),
  v.literal("shopping_add"),
  v.literal("shopping_update"),
  v.literal("shopping_delete"),
  v.literal("meal_create"),
  v.literal("meal_update"),
  v.literal("meal_delete")
);

const mealType = v.union(
  v.literal("breakfast"),
  v.literal("lunch"),
  v.literal("dinner")
);

const eventRecurrence = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("yearly")
);

export default defineSchema({
  households: defineTable({
    id: v.string(),
    ownerId: v.union(v.null(), v.string()),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_name", ["name"]),

  householdMembers: defineTable({
    id: v.string(),
    householdId: v.string(),
    clerkUserId: v.union(v.null(), v.string()),
    name: v.string(),
    role: householdRole,
    locale: memberLocale,
    relation: v.union(v.null(), householdRelation),
    relationLabel: v.union(v.null(), v.string()),
    color: v.union(v.null(), v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_name", ["name"])
    .index("by_clerkUserId", ["clerkUserId"]),

  rolePermissions: defineTable({
    id: v.string(),
    role: householdRole,
    permission: permissionKey,
    allowed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_role", ["role"])
    .index("by_permission", ["permission"])
    .index("by_role_permission", ["role", "permission"]),

  memberPermissions: defineTable({
    id: v.string(),
    memberId: v.string(),
    permission: permissionKey,
    allowed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_memberId", ["memberId"])
    .index("by_permission", ["permission"])
    .index("by_member_permission", ["memberId", "permission"]),

  tasks: defineTable({
    id: v.string(),
    householdId: v.string(),
    title: v.string(),
    description: v.union(v.null(), v.string()),
    assignedToId: v.union(v.null(), v.string()),
    dueDate: v.union(v.null(), v.number()),
    priority: taskPriority,
    recurrence: v.union(v.null(), taskRecurrence),
    recurrenceDays: v.array(v.number()),
    recurrenceDayOfMonth: v.union(v.null(), v.number()),
    recurrenceWeekday: v.union(v.null(), v.number()),
    recurrenceWeekOfMonth: v.union(v.null(), v.number()),
    rotationMode: taskRotationMode,
    rotationAssignees: v.array(v.string()),
    rotationAnchorDate: v.union(v.null(), v.number()),
    completed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_assignedToId", ["assignedToId"])
    .index("by_recurrence", ["recurrence"])
    .index("by_completed", ["completed"])
    .index("by_priority", ["priority"]),

  taskAssignmentOverrides: defineTable({
    id: v.string(),
    taskId: v.string(),
    date: v.number(),
    assignedToId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_assignedToId", ["assignedToId"])
    .index("by_date", ["date"])
    .index("by_taskId_date", ["taskId", "date"]),

  completionRecords: defineTable({
    id: v.string(),
    householdId: v.string(),
    taskId: v.string(),
    completedAt: v.number(),
    completedById: v.string(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_taskId", ["taskId"])
    .index("by_completedAt", ["completedAt"])
    .index("by_completedById", ["completedById"]),

  meals: defineTable({
    id: v.string(),
    householdId: v.string(),
    name: v.string(),
    date: v.number(),
    mealType: mealType,
    notes: v.union(v.null(), v.string()),
    mealLibraryItemId: v.union(v.null(), v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_date", ["date"])
    .index("by_mealType", ["mealType"])
    .index("by_mealLibraryItemId", ["mealLibraryItemId"]),

  mealLibraryItems: defineTable({
    id: v.string(),
    householdId: v.string(),
    name: v.string(),
    notes: v.union(v.null(), v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_name", ["name"]),

  shoppingItems: defineTable({
    id: v.string(),
    householdId: v.string(),
    name: v.string(),
    quantity: v.union(v.null(), v.string()),
    category: v.string(),
    completed: v.boolean(),
    listId: v.union(v.null(), v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_category", ["category"])
    .index("by_completed", ["completed"])
    .index("by_listId", ["listId"]),

  calendarEvents: defineTable({
    id: v.string(),
    householdId: v.string(),
    title: v.string(),
    description: v.union(v.null(), v.string()),
    date: v.number(),
    time: v.union(v.null(), v.string()),
    recurrence: v.union(v.null(), eventRecurrence),
    endDate: v.union(v.null(), v.number()),
    participantId: v.union(v.null(), v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_householdId", ["householdId"])
    .index("by_date", ["date"])
    .index("by_recurrence", ["recurrence"])
    .index("by_participantId", ["participantId"]),
});
