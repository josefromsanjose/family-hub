import type { HouseholdRelation, HouseholdRole } from "@/data/household";

export type MemberFormData = {
  name: string;
  role: HouseholdRole;
  relation: HouseholdRelation | null;
  relationLabel: string;
};

export const isMemberNameValid = (data: MemberFormData) =>
  data.name.trim().length > 0;

export const isMemberRelationValid = (data: MemberFormData) =>
  data.relation !== "other" || data.relationLabel.trim().length > 0;
