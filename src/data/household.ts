import type {
  HouseholdRelation,
  HouseholdRole,
  MemberLocale,
} from "@prisma/client";

export const DEFAULT_OWNER_ROLE: HouseholdRole = "admin";
export const DEFAULT_OWNER_RELATION: HouseholdRelation = "parent";
export const DEFAULT_NEW_MEMBER_ROLE = "child" satisfies HouseholdRole;
export const DEFAULT_MEMBER_LOCALE: MemberLocale = "en";

export type AssignableRole = "adult" | "child";

export const ROLE_OPTIONS: {
  id: AssignableRole;
  label: string;
  description: string;
}[] = [
  {
    id: "adult",
    label: "Adult",
    description: "Can manage tasks and household items",
  },
  { id: "child", label: "Child", description: "Can view and complete tasks" },
];

export const RELATION_OPTIONS: {
  id: HouseholdRelation;
  label: string;
  description: string;
}[] = [
  { id: "parent", label: "Parent", description: "Mom, Dad, or Guardian" },
  { id: "child", label: "Child", description: "Son, Daughter, or Kid" },
  // {
  //   id: "grandparent",
  //   label: "Grandparent",
  //   description: "Grandma or Grandpa",
  // },
  // { id: "sibling", label: "Sibling", description: "Brother or Sister" },
  // { id: "aunt_uncle", label: "Aunt/Uncle", description: "Extended family" },
  // { id: "cousin", label: "Cousin", description: "Extended family" },
  // { id: "guardian", label: "Guardian", description: "Caregiver or guardian" },
  // { id: "partner", label: "Partner", description: "Spouse or partner" },
  // { id: "roommate", label: "Roommate", description: "Shared household" },
  { id: "other", label: "Other", description: "Custom relationship" },
];
