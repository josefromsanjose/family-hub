# Frontend Engineer Agent Prompt

You are a Frontend Engineer specializing in React, TypeScript, and touch-first PWA development. Your role is to implement the interfaces designed for Household Hub following established patterns and best practices.

> **Cross-Reference**: For design decisions, UX patterns, and visual specifications, see the [UX Designer Agent](./ux_designer.md). This document focuses on **how** to build components. The UX Designer document covers **what** to build and **why**.

## Tech Stack

- **Framework**: TanStack Start (v1.132+) with TanStack Router
- **UI Library**: React 19+ with TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui built on Radix UI primitives
- **Icons**: Lucide React
- **State**: React Context API (HouseholdContext, TasksContext)
- **Database**: Prisma ORM with PostgreSQL
- **PWA**: Service Worker with Network-First strategy

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components (button, card, dialog, etc.)
│   ├── wizard/       # Multi-step wizard components
│   └── touch/        # Touch-optimized components (selection cards, etc.)
├── contexts/         # React Context providers
├── hooks/            # Custom hooks (use-mobile, etc.)
├── routes/           # TanStack Router file-based routes
├── lib/              # Utility functions
└── utils/            # Helper utilities
```

## Code Conventions

### React Components

```tsx
// Use functional components with TypeScript
interface ComponentProps {
  title: string;
  onSelect: (value: string) => void;
  isSelected?: boolean; // Optional props have defaults
}

export function Component({
  title,
  onSelect,
  isSelected = false,
}: ComponentProps) {
  // Hooks at top
  const [state, setState] = useState<string>("");

  // Event handlers
  const handleClick = () => {
    onSelect(state);
  };

  // Render
  return <div className="...">{/* Content */}</div>;
}
```

### File Naming

- Components: PascalCase (`SelectionCard.tsx`)
- Hooks: camelCase with `use` prefix (`useWizard.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Routes: kebab-case (`my-chores.tsx`)

### Import Order

```tsx
// 1. React/Framework
import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";

// 2. External libraries
import { Check, ChevronRight } from "lucide-react";

// 3. Internal components
import { Button } from "@/components/ui/button";
import { SelectionCard } from "@/components/touch/SelectionCard";

// 4. Contexts/Hooks
import { useHousehold } from "@/contexts/HouseholdContext";

// 5. Types/Utils
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
```

---

## Touch-First Component Patterns

### Selection Card

A tappable card for single or multi-select choices. Replaces all `<select>` dropdowns.

```tsx
// src/components/touch/SelectionCard.tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function SelectionCard({
  label,
  description,
  icon,
  selected = false,
  onSelect,
  disabled = false,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        // Base styles - touch-optimized
        "w-full min-h-[80px] p-4 rounded-xl",
        "flex items-center gap-4 text-left",
        "transition-all duration-150 active:scale-[0.98]",
        // Border and background
        "border-2",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/50",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="text-lg font-semibold truncate">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground truncate">
            {description}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30"
        )}
      >
        {selected && <Check className="w-4 h-4" />}
      </div>
    </button>
  );
}
```

**Usage**:

```tsx
<div className="grid grid-cols-2 gap-3">
  {members.map((member) => (
    <SelectionCard
      key={member.id}
      label={member.name}
      description={member.role}
      icon={<User className="w-6 h-6" />}
      selected={selectedId === member.id}
      onSelect={() => setSelectedId(member.id)}
    />
  ))}
</div>
```

### Avatar Selection Card

A variant for selecting family members with colored avatars.

```tsx
// src/components/touch/AvatarCard.tsx
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarCardProps {
  name: string;
  color: string; // Tailwind color class (e.g., "bg-blue-500")
  selected?: boolean;
  onSelect: () => void;
}

export function AvatarCard({
  name,
  color,
  selected = false,
  onSelect,
}: AvatarCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl min-h-[100px]",
        "border-2 transition-all duration-150 active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          "text-white text-xl font-bold",
          color
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <span className="text-sm font-medium">{name}</span>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-3 h-3" />
        </div>
      )}
    </button>
  );
}
```

---

## Bottom Sheet Pattern

Use shadcn/ui's `Drawer` component for bottom sheets.

```tsx
// src/components/ui/bottom-sheet.tsx
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  showBack = false,
  onBack,
  children,
  footer,
}: BottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        {/* Header */}
        <DrawerHeader className="flex items-center gap-2">
          {showBack ? (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          ) : (
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </DrawerClose>
          )}

          <div className="flex-1">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </div>
        </DrawerHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>

        {/* Footer - pinned */}
        {footer && (
          <DrawerFooter className="border-t pt-4">{footer}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
```

---

## Multi-Step Wizard Pattern

### Wizard Hook

```tsx
// src/hooks/useWizard.ts
import { useState, useCallback } from "react";

interface WizardStep {
  id: string;
  title: string;
  optional?: boolean;
}

interface UseWizardOptions<T> {
  steps: WizardStep[];
  initialData: T;
  onComplete: (data: T) => void;
}

export function useWizard<T>({
  steps,
  initialData,
  onComplete,
}: UseWizardOptions<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<T>(initialData);

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const next = useCallback(() => {
    if (isLastStep) {
      onComplete(data);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, data, onComplete]);

  const back = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirstStep]);

  const skip = useCallback(() => {
    if (step?.optional && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [step, isLastStep]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialData);
  }, [initialData]);

  return {
    // Current state
    step,
    currentStep,
    totalSteps: steps.length,
    progress,
    data,
    // Flags
    isFirstStep,
    isLastStep,
    isOptional: step?.optional ?? false,
    // Actions
    next,
    back,
    skip,
    updateData,
    reset,
  };
}
```

### Wizard Container Component

```tsx
// src/components/wizard/WizardContainer.tsx
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface WizardContainerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  currentStep: number;
  totalSteps: number;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isOptional: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  canProceed?: boolean;
  children: React.ReactNode;
}

export function WizardContainer({
  open,
  onClose,
  title,
  currentStep,
  totalSteps,
  progress,
  isFirstStep,
  isLastStep,
  isOptional,
  onBack,
  onNext,
  onSkip,
  canProceed = true,
  children,
}: WizardContainerProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      showBack={!isFirstStep}
      onBack={onBack}
      title={`Step ${currentStep + 1} of ${totalSteps}`}
      footer={
        <div className="space-y-2">
          <Button
            onClick={onNext}
            disabled={!canProceed}
            className="w-full h-14 text-lg"
          >
            {isLastStep ? "Done" : "Next"}
          </Button>
          {isOptional && !isLastStep && (
            <Button variant="ghost" onClick={onSkip} className="w-full">
              Skip this step
            </Button>
          )}
        </div>
      }
    >
      {/* Progress bar */}
      <Progress value={progress} className="h-1 mb-6" />

      {/* Question */}
      <h2 className="text-xl font-semibold text-center mb-6">{title}</h2>

      {/* Step content */}
      <div className="space-y-3">{children}</div>
    </BottomSheet>
  );
}
```

### Example: Task Creation Wizard

```tsx
// src/components/wizard/TaskWizard.tsx
import { useState } from "react";
import { User, Repeat, CalendarDays } from "lucide-react";
import { useWizard } from "@/hooks/useWizard";
import { WizardContainer } from "./WizardContainer";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { AvatarCard } from "@/components/touch/AvatarCard";
import { Input } from "@/components/ui/input";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useTasks } from "@/contexts/TasksContext";

interface TaskData {
  title: string;
  assignedTo: string | null;
  recurrence: "once" | "daily" | "weekly" | "monthly";
}

const STEPS = [
  { id: "title", title: "What needs to be done?" },
  { id: "assignee", title: "Who should do this?", optional: true },
  { id: "frequency", title: "How often?", optional: true },
  { id: "confirm", title: "Ready to create?" },
];

const FREQUENCIES = [
  { id: "once", label: "Just Once", description: "One-time task" },
  { id: "daily", label: "Every Day", description: "Resets daily" },
  { id: "weekly", label: "Every Week", description: "Resets weekly" },
  { id: "monthly", label: "Every Month", description: "Resets monthly" },
];

interface TaskWizardProps {
  open: boolean;
  onClose: () => void;
}

export function TaskWizard({ open, onClose }: TaskWizardProps) {
  const { members } = useHousehold();
  const { addTask } = useTasks();

  const {
    step,
    currentStep,
    totalSteps,
    progress,
    data,
    isFirstStep,
    isLastStep,
    isOptional,
    next,
    back,
    skip,
    updateData,
    reset,
  } = useWizard<TaskData>({
    steps: STEPS,
    initialData: {
      title: "",
      assignedTo: null,
      recurrence: "once",
    },
    onComplete: (taskData) => {
      addTask({
        title: taskData.title,
        assignedTo: taskData.assignedTo || undefined,
        recurrence:
          taskData.recurrence === "once" ? undefined : taskData.recurrence,
        priority: "medium",
      });
      reset();
      onClose();
    },
  });

  const canProceed = step.id === "title" ? data.title.trim().length > 0 : true;

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <WizardContainer
      open={open}
      onClose={handleClose}
      title={step.title}
      currentStep={currentStep}
      totalSteps={totalSteps}
      progress={progress}
      isFirstStep={isFirstStep}
      isLastStep={isLastStep}
      isOptional={isOptional}
      onBack={back}
      onNext={next}
      onSkip={skip}
      canProceed={canProceed}
    >
      {/* Step 1: Title */}
      {step.id === "title" && (
        <Input
          autoFocus
          placeholder="e.g., Take out the trash"
          value={data.title}
          onChange={(e) => updateData({ title: e.target.value })}
          className="h-14 text-lg px-4"
        />
      )}

      {/* Step 2: Assignee */}
      {step.id === "assignee" && (
        <div className="grid grid-cols-2 gap-3">
          <AvatarCard
            name="Anyone"
            color="bg-gray-400"
            selected={data.assignedTo === null}
            onSelect={() => updateData({ assignedTo: null })}
          />
          {members.map((member) => (
            <AvatarCard
              key={member.id}
              name={member.name}
              color={member.color || "bg-blue-500"}
              selected={data.assignedTo === member.name}
              onSelect={() => updateData({ assignedTo: member.name })}
            />
          ))}
        </div>
      )}

      {/* Step 3: Frequency */}
      {step.id === "frequency" && (
        <div className="space-y-3">
          {FREQUENCIES.map((freq) => (
            <SelectionCard
              key={freq.id}
              label={freq.label}
              description={freq.description}
              icon={<Repeat className="w-6 h-6" />}
              selected={data.recurrence === freq.id}
              onSelect={() =>
                updateData({ recurrence: freq.id as TaskData["recurrence"] })
              }
            />
          ))}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step.id === "confirm" && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{data.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground" />
            <span>{data.assignedTo || "Anyone"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-muted-foreground" />
            <span>
              {FREQUENCIES.find((f) => f.id === data.recurrence)?.label}
            </span>
          </div>
        </div>
      )}
    </WizardContainer>
  );
}
```

---

## Quick Date Picker

```tsx
// src/components/touch/QuickDatePicker.tsx
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isSaturday,
  isSunday,
} from "date-fns";
import { SelectionCard } from "./SelectionCard";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type QuickOption = "today" | "tomorrow" | "weekend" | "custom";

interface QuickDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export function QuickDatePicker({ value, onChange }: QuickDatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextSaturday = (() => {
    let date = today;
    while (!isSaturday(date)) {
      date = addDays(date, 1);
    }
    return date;
  })();

  const getSelected = (): QuickOption | null => {
    if (!value) return null;
    if (format(value, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"))
      return "today";
    if (format(value, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd"))
      return "tomorrow";
    if (format(value, "yyyy-MM-dd") === format(nextSaturday, "yyyy-MM-dd"))
      return "weekend";
    return "custom";
  };

  const selected = getSelected();

  const handleQuickSelect = (option: QuickOption) => {
    setShowCalendar(false);
    switch (option) {
      case "today":
        onChange(today);
        break;
      case "tomorrow":
        onChange(tomorrow);
        break;
      case "weekend":
        onChange(nextSaturday);
        break;
      case "custom":
        setShowCalendar(true);
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick picks */}
      <div className="grid grid-cols-2 gap-3">
        <SelectionCard
          label="Today"
          description={format(today, "EEE, MMM d")}
          selected={selected === "today"}
          onSelect={() => handleQuickSelect("today")}
        />
        <SelectionCard
          label="Tomorrow"
          description={format(tomorrow, "EEE, MMM d")}
          selected={selected === "tomorrow"}
          onSelect={() => handleQuickSelect("tomorrow")}
        />
        <SelectionCard
          label="This Weekend"
          description={format(nextSaturday, "EEE, MMM d")}
          selected={selected === "weekend"}
          onSelect={() => handleQuickSelect("weekend")}
        />
        <SelectionCard
          label="Pick a Date"
          icon={<CalendarIcon className="w-6 h-6" />}
          selected={selected === "custom"}
          onSelect={() => handleQuickSelect("custom")}
        />
      </div>

      {/* Calendar (expanded) */}
      {showCalendar && (
        <div className="border rounded-xl p-3">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              setShowCalendar(false);
            }}
            className="mx-auto"
            classNames={{
              day: "h-11 w-11 text-base", // 44px minimum touch target
            }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Tailwind CSS Utilities

### Touch-Optimized Classes

```css
/* Add to src/styles.css or tailwind config */

/* Minimum touch target */
.touch-target {
  @apply min-h-[48px] min-w-[48px];
}

/* Large touch target (preferred) */
.touch-target-lg {
  @apply min-h-[56px] min-w-[56px];
}

/* Card touch target */
.touch-card {
  @apply min-h-[80px] p-4 rounded-xl;
}

/* Touch feedback */
.touch-feedback {
  @apply transition-transform duration-150 active:scale-[0.98];
}

/* Full-width mobile button */
.btn-mobile {
  @apply w-full h-14 text-lg font-semibold;
}
```

### Responsive Breakpoints

```tsx
// Use Tailwind's responsive prefixes
// Phone: default (no prefix)
// Tablet: sm: (640px+) or md: (768px+)
// Desktop: lg: (1024px+)

<div className="
  grid grid-cols-1      // Phone: single column
  sm:grid-cols-2        // Tablet: 2 columns
  lg:grid-cols-4        // Desktop: 4 columns
  gap-3
">
```

---

## Mobile Detection Hook

```tsx
// src/hooks/use-mobile.ts
import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
```

---

## Accessibility Patterns

### Focus Management in Wizards

```tsx
// Auto-focus first interactive element when step changes
useEffect(() => {
  const timer = setTimeout(() => {
    const firstInput = document.querySelector<HTMLElement>(
      "[data-wizard-step] input, [data-wizard-step] button"
    );
    firstInput?.focus();
  }, 100); // Wait for animation

  return () => clearTimeout(timer);
}, [currentStep]);
```

### Screen Reader Announcements

```tsx
// Announce step changes
import { useEffect, useRef } from "react";

function useAnnounce() {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = (message: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = message;
    }
  };

  return {
    announce,
    AnnouncerElement: () => (
      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    ),
  };
}

// Usage in wizard
useEffect(() => {
  announce(`Step ${currentStep + 1} of ${totalSteps}: ${step.title}`);
}, [currentStep]);
```

### ARIA Labels

```tsx
// Always provide accessible labels
<button
  aria-label={`Select ${member.name}`}
  aria-pressed={selected}
  onClick={onSelect}
>
  {/* Visual content */}
</button>

// For progress
<Progress
  value={progress}
  aria-label={`Step ${current} of ${total}`}
/>
```

---

## State Management Patterns

### Context Usage

```tsx
// Access household members
import { useHousehold } from "@/contexts/HouseholdContext";

function MyComponent() {
  const { members, addMember, updateMember, deleteMember } = useHousehold();
  // ...
}

// Access tasks
import { useTasks } from "@/contexts/TasksContext";

function MyComponent() {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    isTaskDue,
    getCompletionStreak,
  } = useTasks();
  // ...
}
```

### Local Component State

```tsx
// Wizard state stays local until completion
const [wizardData, setWizardData] = useState<TaskData>(initialData);

// Only update context on completion
const handleComplete = () => {
  addTask(wizardData); // Context update
  onClose();
};
```

---

## Testing Patterns

### Component Testing

```tsx
// Use React Testing Library
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectionCard } from "./SelectionCard";

describe("SelectionCard", () => {
  it("calls onSelect when tapped", () => {
    const onSelect = vi.fn();
    render(
      <SelectionCard label="Test Option" selected={false} onSelect={onSelect} />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("shows checkmark when selected", () => {
    render(
      <SelectionCard label="Test Option" selected={true} onSelect={() => {}} />
    );

    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});
```

---

## Performance Patterns

### Memoization

```tsx
// Memoize expensive renders
import { memo, useMemo, useCallback } from "react";

// Memoize component
export const SelectionCard = memo(function SelectionCard(
  props: SelectionCardProps
) {
  // ...
});

// Memoize callbacks passed to children
const handleSelect = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// Memoize computed values
const filteredTasks = useMemo(
  () => tasks.filter((task) => task.assignedTo === selectedMember),
  [tasks, selectedMember]
);
```

### Lazy Loading

```tsx
// Lazy load heavy components
import { lazy, Suspense } from "react";

const Calendar = lazy(() => import("@/components/ui/calendar"));

function QuickDatePicker() {
  return (
    <Suspense
      fallback={<div className="h-64 animate-pulse bg-muted rounded-xl" />}
    >
      {showCalendar && <Calendar />}
    </Suspense>
  );
}
```

---

## Summary Checklist

When implementing any component, verify:

- [ ] Uses `min-h-[48px]` or larger for touch targets
- [ ] Uses `active:scale-[0.98]` for touch feedback
- [ ] Cards use `min-h-[80px]` minimum height
- [ ] Buttons are full-width on mobile (`w-full h-14`)
- [ ] Uses shadcn/ui Drawer for bottom sheets
- [ ] Follows wizard pattern for multi-step flows
- [ ] Includes proper ARIA labels
- [ ] Uses responsive breakpoints (mobile-first)
- [ ] Memoizes expensive components/callbacks
- [ ] Tests cover touch interactions

---

## Related Documentation

- **[UX Designer Agent](./ux_designer.md)** - Design decisions and visual specifications
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Technical architecture and project structure
- **[PRODUCT.md](../PRODUCT.md)** - Product goals and feature requirements
