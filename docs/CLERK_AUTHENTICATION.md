# Clerk Authentication with TanStack Router

## Overview

This guide explains how to add login and registration pages using Clerk with TanStack Router in the Family Hub application.

## Setup

### 1. Clerk Provider

The Clerk provider is already set up in `src/integrations/clerk/provider.tsx` and wrapped in `src/routes/__root.tsx`.

**Environment Variables Required:**

- `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (add to `.env.local`)

### 2. Clerk Dashboard Configuration

In your Clerk Dashboard, configure the following URLs:

- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in redirect**: `/` (or your dashboard)
- **After sign-up redirect**: `/` (or your dashboard)

## Implementation

### Login Page (`/sign-in`)

The login page uses Clerk's `<SignIn>` component which provides a complete authentication UI.

**File**: `src/routes/sign-in.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
      />
    </div>
  );
}
```

### Registration Page (`/sign-up`)

The registration page uses Clerk's `<SignUp>` component.

**File**: `src/routes/sign-up.tsx`

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
      />
    </div>
  );
}
```

## Route Protection

### Option 1: Using Clerk Components (Recommended for Simple Cases)

Use Clerk's `<SignedIn>` and `<SignedOut>` components to conditionally render content:

```tsx
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";

function MyComponent() {
  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>{/* Protected content */}</SignedIn>
    </>
  );
}
```

### Option 2: Using `useAuth` Hook in Components

Check authentication state using the `useAuth` hook:

```tsx
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "@tanstack/react-router";

function ProtectedComponent() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return <div>Protected Content</div>;
}
```

### Option 3: Route-Level Protection with `beforeLoad`

For TanStack Router with Clerk React (client-side), you can protect routes using a helper function:

**Create a utility** (`src/utils/auth.ts`):

```tsx
import { redirect } from "@tanstack/react-router";

export function requireAuth() {
  // This will be called from within a component context
  // For beforeLoad, we need a different approach
  throw redirect({ to: "/sign-in" });
}
```

**In your route** (`src/routes/protected.tsx`):

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/protected")({
  component: ProtectedRoute,
});

function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return <div>Protected Content</div>;
}
```

**Note**: `beforeLoad` in TanStack Router runs before React components mount, so you cannot use React hooks there. For client-side authentication checks, handle them in the component itself.

## User Profile & Sign Out

### User Button Component

Clerk provides a `<UserButton>` component that shows user profile and sign-out options:

```tsx
import { UserButton } from "@clerk/clerk-react";

function Header() {
  return (
    <header>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
```

### Programmatic Sign Out

```tsx
import { useClerk } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";

function SignOutButton() {
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## Redirect After Authentication

### Preserve Intended Destination

To redirect users back to their intended destination after sign-in:

1. **Capture the redirect URL** when redirecting to sign-in:

```tsx
import { useNavigate } from "@tanstack/react-router";

function ProtectedComponent() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  if (!isSignedIn) {
    navigate({
      to: "/sign-in",
      search: { redirect: window.location.pathname },
    });
  }
}
```

2. **Use the redirect in SignIn component**:

```tsx
function SignInPage() {
  const { redirect } = Route.useSearch();

  return <SignIn afterSignInUrl={redirect || "/"} signUpUrl="/sign-up" />;
}
```

## Environment Variables

Add to `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Clerk Dashboard Settings

1. Go to your Clerk Dashboard
2. Navigate to **Paths** section
3. Set:
   - **Sign-in path**: `/sign-in`
   - **Sign-up path**: `/sign-up`
   - **After sign-in URL**: `/`
   - **After sign-up URL**: `/`

## Testing

1. Start the dev server: `npm run dev`
2. Navigate to `/sign-in` or `/sign-up`
3. Test the authentication flow
4. Verify protected routes redirect to sign-in when not authenticated

## Example: Updating Header Component

Here's how to add authentication UI to your Header component:

```tsx
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";

export default function Header() {
  return (
    <header className="bg-background border-b border-border">
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold">
          🏠 Household Hub
        </Link>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
```

## Example: Protecting a Route

Here's a complete example of protecting a route:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "../utils/auth";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background p-6">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        {/* Your settings content */}
      </div>
    </RequireAuth>
  );
}
```

## Next Steps

1. ✅ Add route protection to existing routes (dashboard, settings, etc.)
2. ✅ Update Header component to show UserButton when signed in
3. Add authentication checks to API calls
4. Sync Clerk user data with your database (Prisma)
5. Add user profile page
6. Implement multi-household support (link Clerk users to households)

## Resources

- [Clerk React Documentation](https://clerk.com/docs/references/clerk-react/overview)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [Clerk Components Reference](https://clerk.com/docs/components/overview)
