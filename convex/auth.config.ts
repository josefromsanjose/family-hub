import type { AuthConfig } from "convex/server";

const clerkIssuerUrl = process.env.CLERK_ISSUER_URL;
const clerkJwtAudience = process.env.CLERK_JWT_AUDIENCE;

if (!clerkIssuerUrl || !clerkJwtAudience) {
  throw new Error("Missing CLERK_ISSUER_URL or CLERK_JWT_AUDIENCE");
}

export default {
  providers: [
    {
      domain: clerkIssuerUrl,
      applicationID: clerkJwtAudience,
    },
  ],
} satisfies AuthConfig;
