import { ConvexHttpClient } from "convex/browser";
import type { HttpMutationOptions } from "convex/browser";
import type {
  ArgsAndOptions,
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
  UserIdentityAttributes,
} from "convex/server";
import { getClerkUserId } from "@/server/clerk";

type AnyQuery = FunctionReference<"query", any, any, any>;
type AnyMutation = FunctionReference<"mutation", any, any, any>;
type AnyAction = FunctionReference<"action", any, any, any>;

type ConvexHttpClientInternal = Omit<
  ConvexHttpClient,
  "query" | "mutation" | "action"
> & {
  query<Query extends AnyQuery>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Promise<FunctionReturnType<Query>>;
  mutation<Mutation extends AnyMutation>(
    mutation: Mutation,
    ...args: ArgsAndOptions<Mutation, HttpMutationOptions>
  ): Promise<FunctionReturnType<Mutation>>;
  action<Action extends AnyAction>(
    action: Action,
    ...args: OptionalRestArgs<Action>
  ): Promise<FunctionReturnType<Action>>;
  setAdminAuth: (
    token: string,
    actingAsIdentity?: Record<string, unknown>
  ) => void;
};

function getConvexUrl() {
  const url = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
  if (!url) {
    throw new Error("Missing CONVEX_URL or VITE_CONVEX_URL");
  }
  return url;
}

function getConvexAdminKey() {
  const key = process.env.CONVEX_ADMIN_KEY;
  if (!key) {
    throw new Error("Missing CONVEX_ADMIN_KEY");
  }
  return key;
}

function getClerkIssuer() {
  const issuer = process.env.CLERK_ISSUER_URL;
  if (!issuer) {
    throw new Error("Missing CLERK_ISSUER_URL");
  }
  return issuer;
}

export async function getConvexClient(
  clerkUserId?: string
): Promise<ConvexHttpClientInternal> {
  const identityUserId = clerkUserId ?? (await getClerkUserId());
  const actingAsIdentity: UserIdentityAttributes = {
    subject: identityUserId,
    issuer: getClerkIssuer(),
  };

  const convexClient = new ConvexHttpClient(
      getConvexUrl()
    ) as unknown as ConvexHttpClientInternal;
  convexClient.setAdminAuth(getConvexAdminKey(), actingAsIdentity);
  return convexClient;
}
