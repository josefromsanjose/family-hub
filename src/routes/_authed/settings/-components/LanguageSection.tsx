import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Languages } from "lucide-react";
import type { MemberLocale } from "@prisma/client";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { m } from "@paraglide/messages";
import { useLocale } from "@/contexts/LocaleContext";
import {
  updateHouseholdMember,
  type HouseholdMemberResponse,
} from "@/server/household";

interface LanguageSectionProps {
  members: HouseholdMemberResponse[];
  userId?: string | null;
}

export function LanguageSection({ members, userId }: LanguageSectionProps) {
  const queryClient = useQueryClient();
  const { locale: appLocale, setLocale: setAppLocale } = useLocale();

  const localeMutation = useMutation({
    mutationFn: updateHouseholdMember,
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      setAppLocale(member.locale);
    },
  });

  const currentMember =
    userId && members.length > 0
      ? members.find((member) => member.clerkUserId === userId)
      : undefined;
  const activeLocale = currentMember?.locale ?? appLocale;

  const handleLocaleChange = (locale: MemberLocale) => {
    if (!currentMember || currentMember.locale === locale) return;

    localeMutation.mutate({
      data: {
        id: currentMember.id,
        locale,
      },
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mt-12">
        <Languages className="text-muted-foreground" size={24} />
        <h2 className="text-xl font-bold text-foreground">
          {m.language_heading()}
        </h2>
      </div>
      <p className="text-muted-foreground mb-6">{m.language_description()}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <SelectionCard
          label={m.language_option_english()}
          selected={activeLocale === "en"}
          onSelect={() => handleLocaleChange("en")}
          disabled={!currentMember || localeMutation.isPending}
        />
        <SelectionCard
          label={m.language_option_spanish()}
          selected={activeLocale === "es"}
          onSelect={() => handleLocaleChange("es")}
          disabled={!currentMember || localeMutation.isPending}
        />
      </div>
    </div>
  );
}
