import { addTaskTool } from "./add-task";
import { currentTimeTool } from "./current-time";
import { listTasksTool } from "./list-tasks";
import {
  addTaskDefinition,
  currentTimeDefinition,
  listTasksDefinition,
} from "./definitions";

const tools = [currentTimeTool, listTasksTool, addTaskTool];
const toolDefinitions = [
  currentTimeDefinition,
  listTasksDefinition,
  addTaskDefinition,
];

export const getAgentTools = () => tools;
export const getAgentToolDefinitions = () => toolDefinitions;
