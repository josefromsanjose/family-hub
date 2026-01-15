import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Loader2, Check } from "lucide-react";
import { createHouseholdMember } from "@/server/household";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SelectionCard } from "@/components/touch/SelectionCard";
import {
  DEFAULT_NEW_MEMBER_ROLE,
  RELATION_OPTIONS,
  ROLE_OPTIONS,
  type AssignableRole,
} from "@/data/household";
import type { HouseholdRelation } from "@prisma/client";

export const Route = createFileRoute("/_authed/settings/members/new")({
  component: NewMemberWizard,
});

// Wizard step definitions
const STEPS = [
  { id: "name", title: "What's their name?", optional: false },
  { id: "role", title: "What's their role?", optional: false },
  { id: "relation", title: "What's their relationship?", optional: false },
  { id: "confirm", title: "Ready to add?", optional: false },
] as const;

type StepId = (typeof STEPS)[number]["id"];
const ROLE_CONFIRM_COPY: Record<AssignableRole, string> = {
  adult: "Can manage tasks and household items",
  child: "Can view and complete assigned tasks",
};

// Member data being collected
interface MemberData {
  name: string;
  role: AssignableRole;
  relation: HouseholdRelation | null;
  relationLabel: string;
}

const STEP_VALIDATORS: Record<StepId, (data: MemberData) => boolean> = {
  name: (data) => data.name.trim().length > 0,
  role: () => true,
  relation: (data) =>
    data.relation !== "other" || data.relationLabel.trim().length > 0,
  confirm: () => true,
};

interface StepProps {
  data: MemberData;
  onChange: (next: Partial<MemberData>) => void;
  onEnter: () => void;
  canProceed: boolean;
  mutationError: unknown;
}

const NameStep = ({ data, onChange, onEnter, canProceed }: StepProps) => (
  <div className="space-y-4">
    <Input
      data-wizard-input="name"
      type="text"
      placeholder="e.g., Emma, Dad, Grandma"
      value={data.name}
      autoFocus
      onChange={(e) => onChange({ name: e.target.value })}
      onKeyDown={(e) => {
        if (e.key === "Enter" && canProceed) {
          onEnter();
        }
      }}
      className="h-14 text-lg px-4"
      autoComplete="off"
    />
    <p className="text-sm text-muted-foreground text-center">
      Enter the name of the household member you want to add
    </p>
  </div>
);

const RoleStep = ({ data, onChange }: StepProps) => (
  <div className="space-y-3">
    {ROLE_OPTIONS.map((option) => (
      <SelectionCard
        key={option.id}
        label={option.label}
        description={option.description}
        selected={data.role === option.id}
        onSelect={() => onChange({ role: option.id })}
      />
    ))}
  </div>
);

const RelationStep = ({ data, onChange }: StepProps) => (
  <div className="space-y-4">
    <div className="space-y-3">
      {RELATION_OPTIONS.map((option) => (
        <SelectionCard
          key={option.id}
          label={option.label}
          description={option.description}
          selected={data.relation === option.id}
          onSelect={() =>
            onChange({
              relation: option.id,
              relationLabel:
                option.id === "other" ? data.relationLabel : option.label,
            })
          }
        />
      ))}
    </div>
    {data.relation === "other" && (
      <Input
        type="text"
        placeholder="e.g., Godparent, Nanny, Family Friend"
        value={data.relationLabel}
        onChange={(e) => onChange({ relationLabel: e.target.value })}
        className="h-12 text-base px-4"
        autoComplete="off"
      />
    )}
  </div>
);

const ConfirmStep = ({ data, mutationError }: StepProps) => (
  <div className="space-y-6">
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
          {data.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{data.name}</h3>
          <p className="text-muted-foreground capitalize">{data.role}</p>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>Will be added to your household</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="w-4 h-4" />
          <span>{ROLE_CONFIRM_COPY[data.role]}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="w-4 h-4" />
          <span>
            {data.relation
              ? `Relationship: ${
                  data.relation === "other" && data.relationLabel.trim()
                    ? data.relationLabel.trim()
                    : data.relation.replace("_", " ")
                }`
              : "Relationship: Not set"}
          </span>
        </div>
      </div>
    </div>

    {mutationError instanceof Error && (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
        <p className="text-sm text-destructive">
          {(mutationError as { message?: string }).message ||
            "Failed to add member"}
        </p>
      </div>
    )}
  </div>
);

function NewMemberWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<MemberData>({
    name: "",
    role: DEFAULT_NEW_MEMBER_ROLE,
    relation: null,
    relationLabel: "",
  });

  // Mutation for creating member
  const createMutation = useMutation({
    mutationFn: createHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      navigate({ to: "/settings" });
    },
  });

  // Current step info
  const step = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Can proceed to next step?
  const canProceed = useMemo(
    () => STEP_VALIDATORS[step.id](data),
    [step.id, data]
  );

  const handleBack = useCallback(() => {
    if (isFirstStep) {
      navigate({ to: "/settings" });
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep, navigate]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;

    if (isLastStep) {
      // Submit the member
      createMutation.mutate({
        data: {
          name: data.name.trim(),
          role: data.role,
          relation: data.relation ?? undefined,
          relationLabel: data.relationLabel.trim() || undefined,
        },
      });
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canProceed, isLastStep, createMutation, data]);

  const handleSkip = useCallback(() => {
    if (step.optional && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [step.optional, isLastStep]);

  const updateData = useCallback(
    (next: Partial<MemberData>) => {
      setData((prev) => ({ ...prev, ...next }));
    },
    [setData]
  );

  const StepContent = useMemo(() => {
    const stepId = step.id;
    if (stepId === "name") return NameStep;
    if (stepId === "role") return RoleStep;
    if (stepId === "relation") return RelationStep;
    return ConfirmStep;
  }, [step.id]);

  return (
    <div className="bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-2 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full">
        {/* Question */}
        <h1 className="text-2xl font-bold text-center mb-8">{step.title}</h1>

        {/* Step content */}
        <div className="flex-1">
          <StepContent
            data={data}
            onChange={updateData}
            onEnter={handleNext}
            canProceed={canProceed}
            mutationError={createMutation.error}
          />
        </div>

        {/* Footer actions */}
        <div className="mt-8 space-y-3">
          <Button
            onClick={handleNext}
            disabled={!canProceed || createMutation.isPending}
            className="w-full h-14 text-lg"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : isLastStep ? (
              "Add Member"
            ) : (
              "Next"
            )}
          </Button>

          {step.optional && !isLastStep && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              Skip this step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
