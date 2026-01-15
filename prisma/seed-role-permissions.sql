-- Seed RolePermission defaults (global templates)
-- Run in Supabase SQL Editor after schema is created.

INSERT INTO role_permissions (id, role, permission, allowed, "createdAt", "updatedAt")
VALUES
  -- admin: allow all
  (gen_random_uuid(), 'admin', 'member_add', true, now(), now()),
  (gen_random_uuid(), 'admin', 'member_delete', true, now(), now()),
  (gen_random_uuid(), 'admin', 'member_role_change', true, now(), now()),
  (gen_random_uuid(), 'admin', 'task_create', true, now(), now()),
  (gen_random_uuid(), 'admin', 'task_update', true, now(), now()),
  (gen_random_uuid(), 'admin', 'task_delete', true, now(), now()),
  (gen_random_uuid(), 'admin', 'chores_complete', true, now(), now()),
  (gen_random_uuid(), 'admin', 'chores_delete', true, now(), now()),
  (gen_random_uuid(), 'admin', 'calendar_create', true, now(), now()),
  (gen_random_uuid(), 'admin', 'calendar_update', true, now(), now()),
  (gen_random_uuid(), 'admin', 'calendar_delete', true, now(), now()),
  (gen_random_uuid(), 'admin', 'shopping_add', true, now(), now()),
  (gen_random_uuid(), 'admin', 'shopping_update', true, now(), now()),
  (gen_random_uuid(), 'admin', 'shopping_delete', true, now(), now()),
  (gen_random_uuid(), 'admin', 'meal_create', true, now(), now()),
  (gen_random_uuid(), 'admin', 'meal_update', true, now(), now()),
  (gen_random_uuid(), 'admin', 'meal_delete', true, now(), now()),

  -- adult: management without member delete/role change
  (gen_random_uuid(), 'adult', 'member_add', true, now(), now()),
  (gen_random_uuid(), 'adult', 'member_delete', false, now(), now()),
  (gen_random_uuid(), 'adult', 'member_role_change', false, now(), now()),
  (gen_random_uuid(), 'adult', 'task_create', true, now(), now()),
  (gen_random_uuid(), 'adult', 'task_update', true, now(), now()),
  (gen_random_uuid(), 'adult', 'task_delete', true, now(), now()),
  (gen_random_uuid(), 'adult', 'chores_complete', true, now(), now()),
  (gen_random_uuid(), 'adult', 'chores_delete', true, now(), now()),
  (gen_random_uuid(), 'adult', 'calendar_create', true, now(), now()),
  (gen_random_uuid(), 'adult', 'calendar_update', true, now(), now()),
  (gen_random_uuid(), 'adult', 'calendar_delete', true, now(), now()),
  (gen_random_uuid(), 'adult', 'shopping_add', true, now(), now()),
  (gen_random_uuid(), 'adult', 'shopping_update', true, now(), now()),
  (gen_random_uuid(), 'adult', 'shopping_delete', true, now(), now()),
  (gen_random_uuid(), 'adult', 'meal_create', true, now(), now()),
  (gen_random_uuid(), 'adult', 'meal_update', true, now(), now()),
  (gen_random_uuid(), 'adult', 'meal_delete', true, now(), now()),

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
