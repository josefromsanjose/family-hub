import { useEffect } from "react";
import {
  HeadContent,
  Scripts,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import AppClerkProvider from "@/integrations/clerk/provider";
import Header from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
import { TasksProvider } from "@/contexts/TasksContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { fetchClerkAuth } from "@/server/auth";
import { registerServiceWorker } from "../utils/registerServiceWorker";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth();

    return {
      userId,
    };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      },
      {
        name: "description",
        content:
          "Manage meals, shopping, chores, and schedules for your family",
      },
      {
        name: "theme-color",
        content: "#0a0a0b",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Household Hub",
      },
      {
        title: "Household Hub",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "apple-touch-icon",
        href: "/logo192.png",
      },
    ],
  }),

  shellComponent: RootComponent,
});

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" role="presentation" {...props}>
      <path d="M16 0L18.5 12.2L32 16L18.5 19.8L16 32L13.5 19.8L0 16L13.5 12.2L16 0Z" />
    </svg>
  );
}

function RootComponent() {
  return (
    <AppClerkProvider>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </AppClerkProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker for PWA support
    registerServiceWorker();
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="app-shell">
        <HouseholdProvider>
          <TasksProvider>
            <CalendarProvider>
              <div className="min-h-screen flex flex-col app-shell">
                <div className="app-background" aria-hidden="true">
                  <div className="app-stars" aria-hidden="true">
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                    <StarIcon className="app-star" />
                  </div>
                  <svg
                    className="app-glow app-glow-primary"
                    viewBox="0 0 800 800"
                    role="presentation"
                  >
                    <circle cx="400" cy="400" r="320" />
                  </svg>
                  <svg
                    className="app-glow app-glow-secondary"
                    viewBox="0 0 900 900"
                    role="presentation"
                  >
                    <ellipse cx="450" cy="450" rx="360" ry="280" />
                  </svg>
                
                </div>
                <Header />
                <main className="flex-1 min-h-0 z-10">{children}</main>
              </div>
              <Toaster />
              <TanStackDevtools
                config={{
                  position: "bottom-right",
                }}
                plugins={[
                  {
                    name: "Tanstack Router",
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                ]}
              />
            </CalendarProvider>
          </TasksProvider>
        </HouseholdProvider>
        <Scripts />
      </body>
    </html>
  );
}
