import { currentTimeDefinition } from "./definitions";

export const currentTimeTool = currentTimeDefinition.server(async () =>
  JSON.stringify(new Date().toISOString())
);
