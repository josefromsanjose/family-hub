declare module "@paraglide/messages" {
  export * from "../generated/paraglide/messages.js";
  export const m: typeof import("../generated/paraglide/messages.js");
}

declare module "@paraglide/runtime" {
  export * from "../generated/paraglide/runtime.js";
}

declare module "@paraglide/server" {
  export * from "../generated/paraglide/server.js";
}
