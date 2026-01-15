import { useAuth } from "@clerk/tanstack-react-start";
import { Navigate, useLocation } from "@tanstack/react-router";
import { ReactNode } from "react";

/**
 * Higher-order component to protect routes that require authentication
 *
 * Usage:
 * ```tsx
 * export const Route = createFileRoute("/protected")({
 *   component: ProtectedRoute,
 * });
 *
 * function ProtectedRoute() {
 *   return (
 *     <RequireAuth>
 *       <YourProtectedContent />
 *     </RequireAuth>
 *   );
 * }
 * ```
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }

  return <>{children}</>;
}

/**
 * Hook to get authentication state
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { isSignedIn, userId, user } = useAuthState();
 *
 *   if (!isSignedIn) {
 *     return <SignInButton />;
 *   }
 *
 *   return <div>Welcome, {user?.firstName}!</div>;
 * }
 * ```
 */
export function useAuthState() {
  // Only destructure what actually exists on the return value from useAuth
  const { isLoaded, isSignedIn, userId } = useAuth();

  // Accept user as possibly coming from experimental APIs, or return undefined for now
  const user = (useAuth() as any).user;

  return {
    isLoaded,
    isSignedIn: isLoaded && isSignedIn,
    userId,
    user,
  };
}

/**
 * Conditionally applies authentication based on the current route path.
 * Public routes (sign-in, sign-up) are allowed without authentication.
 * All other routes require authentication.
 *
 * Usage:
 * ```tsx
 * // In __root.tsx
 * <ClerkProvider>
 *   <ConditionalAuth>
 *     <YourAppContent />
 *   </ConditionalAuth>
 * </ClerkProvider>
 * ```
 */
export function ConditionalAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const publicRoutes = ["/sign-in", "/sign-up"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <RequireAuth>{children}</RequireAuth>;
}
