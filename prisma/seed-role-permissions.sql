-- Seed RolePermission defaults (global templates)
-- Run in Supabase SQL Editor after schema is created.

INSERT INTO role_permissions (id, role, permission, allowed, "createdAt", "updatedAt")
VALUES
  -- owner: allow all
  (gen_random_uuid(), 'owner', 'member_add', true, now(), now()),
  (gen_random_uuid(), 'owner', 'member_delete', true, now(), now()),
  (gen_random_uuid(), 'owner', 'member_role_change', true, now(), now()),
  (gen_random_uuid(), 'owner', 'task_create', true, now(), now()),
  (gen_random_uuid(), 'owner', 'task_update', true, now(), now()),
  (gen_random_uuid(), 'owner', 'task_delete', true, now(), now()),
  (gen_random_uuid(), 'owner', 'chores_complete', true, now(), now()),
  (gen_random_uuid(), 'owner', 'chores_delete', true, now(), now()),
  (gen_random_uuid(), 'owner', 'calendar_create', true, now(), now()),
  (gen_random_uuid(), 'owner', 'calendar_update', true, now(), now()),
  (gen_random_uuid(), 'owner', 'calendar_delete', true, now(), now()),
  (gen_random_uuid(), 'owner', 'shopping_add', true, now(), now()),
  (gen_random_uuid(), 'owner', 'shopping_update', true, now(), now()),
  (gen_random_uuid(), 'owner', 'shopping_delete', true, now(), now()),
  (gen_random_uuid(), 'owner', 'meal_create', true, now(), now()),
  (gen_random_uuid(), 'owner', 'meal_update', true, now(), now()),
  (gen_random_uuid(), 'owner', 'meal_delete', true, now(), now()),

  -- parent: management without member delete/role change
  (gen_random_uuid(), 'parent', 'member_add', true, now(), now()),
  (gen_random_uuid(), 'parent', 'member_delete', false, now(), now()),
  (gen_random_uuid(), 'parent', 'member_role_change', false, now(), now()),
  (gen_random_uuid(), 'parent', 'task_create', true, now(), now()),
  (gen_random_uuid(), 'parent', 'task_update', true, now(), now()),
  (gen_random_uuid(), 'parent', 'task_delete', true, now(), now()),
  (gen_random_uuid(), 'parent', 'chores_complete', true, now(), now()),
  (gen_random_uuid(), 'parent', 'chores_delete', true, now(), now()),
  (gen_random_uuid(), 'parent', 'calendar_create', true, now(), now()),
  (gen_random_uuid(), 'parent', 'calendar_update', true, now(), now()),
  (gen_random_uuid(), 'parent', 'calendar_delete', true, now(), now()),
  (gen_random_uuid(), 'parent', 'shopping_add', true, now(), now()),
  (gen_random_uuid(), 'parent', 'shopping_update', true, now(), now()),
  (gen_random_uuid(), 'parent', 'shopping_delete', true, now(), now()),
  (gen_random_uuid(), 'parent', 'meal_create', true, now(), now()),
  (gen_random_uuid(), 'parent', 'meal_update', true, now(), now()),
  (gen_random_uuid(), 'parent', 'meal_delete', true, now(), now()),

  -- child: limited
  (gen_random_uuid(), 'child', 'member_add', false, now(), now()),
  (gen_random_uuid(), 'child', 'member_delete', false, now(), now()),
  (gen_random_uuid(), 'child', 'member_role_change', false, now(), now()),
  (gen_random_uuid(), 'child', 'task_create', false, now(), now()),
  (gen_random_uuid(), 'child', 'task_update', false, now(), now()),
  (gen_random_uuid(), 'child', 'task_delete', false, now(), now()),
  (gen_random_uuid(), 'child', 'chores_complete', true, now(), now()),
  (gen_random_uuid(), 'child', 'chores_delete', false, now(), now()),
  (gen_random_uuid(), 'child', 'calendar_create', true, now(), now()),
  (gen_random_uuid(), 'child', 'calendar_update', true, now(), now()),
  (gen_random_uuid(), 'child', 'calendar_delete', true, now(), now()),
  (gen_random_uuid(), 'child', 'shopping_add', true, now(), now()),
  (gen_random_uuid(), 'child', 'shopping_update', true, now(), now()),
  (gen_random_uuid(), 'child', 'shopping_delete', false, now(), now()),
  (gen_random_uuid(), 'child', 'meal_create', false, now(), now()),
  (gen_random_uuid(), 'child', 'meal_update', false, now(), now()),
  (gen_random_uuid(), 'child', 'meal_delete', false, now(), now())
ON CONFLICT (role, permission) DO NOTHING;
