import { currentTimeDefinition } from "./definitions";

export const currentTimeTool = currentTimeDefinition.server(async () => ({
  iso: new Date().toISOString(),
}));
