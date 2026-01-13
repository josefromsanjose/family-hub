import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface HouseholdMember {
  id: string;
  name: string;
  role?: string;
  color?: string;
}

interface HouseholdContextType {
  members: HouseholdMember[];
  addMember: (member: Omit<HouseholdMember, "id">) => void;
  updateMember: (id: string, member: Partial<HouseholdMember>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => HouseholdMember | undefined;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

const STORAGE_KEY = "household-members";

const defaultMembers: HouseholdMember[] = [
  { id: "1", name: "Mom", role: "Parent", color: "bg-pink-500" },
  { id: "2", name: "Dad", role: "Parent", color: "bg-blue-500" },
];

const colors = [
  "bg-pink-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-indigo-500",
];

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<HouseholdMember[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return defaultMembers;
    } catch {
      return defaultMembers;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  const addMember = (member: Omit<HouseholdMember, "id">) => {
    const newMember: HouseholdMember = {
      ...member,
      id: Date.now().toString(),
      color: member.color || colors[members.length % colors.length],
    };
    setMembers([...members, newMember]);
  };

  const updateMember = (id: string, updates: Partial<HouseholdMember>) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const getMemberById = (id: string) => {
    return members.find((m) => m.id === id);
  };

  return (
    <HouseholdContext.Provider
      value={{ members, addMember, updateMember, deleteMember, getMemberById }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
}
