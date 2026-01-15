import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";
import { z } from "zod";

export const Route = createFileRoute("/sign-in")({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  component: SignInPage,
});

function SignInPage() {
  const { redirect } = Route.useSearch();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={redirect ?? "/"}
      />
    </div>
  );
}
