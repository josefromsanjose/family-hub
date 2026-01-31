import { ConvexHttpClient } from "convex/browser";
import type { HttpMutationOptions } from "convex/browser";
import type {
  ArgsAndOptions,
  FunctionReference,
  FunctionReturnType,
  OptionalRestArgs,
} from "convex/server";

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

let convexClient: ConvexHttpClientInternal | null = null;

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

export function getConvexClient() {
  if (!convexClient) {
    convexClient = new ConvexHttpClient(
      getConvexUrl()
    ) as unknown as ConvexHttpClientInternal;
    convexClient.setAdminAuth(getConvexAdminKey());
  }
  return convexClient;
}
