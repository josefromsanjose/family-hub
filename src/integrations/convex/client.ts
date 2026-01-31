import { ConvexReactClient } from "convex/react";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Missing VITE_CONVEX_URL");
}

export const convexClient = new ConvexReactClient(CONVEX_URL);
