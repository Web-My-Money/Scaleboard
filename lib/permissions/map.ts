import type { Role } from "@/lib/schemas";

/**
 * Actions that can be permission-gated across the app. Keep this list
 * intentional and small — every action maps to specific UI buttons or
 * API routes via `requirePermission`.
 */
export type Action =
  | "client.create"
  | "client.update"
  | "client.archive"
  | "client.view"
  | "brief.commit"
  | "brief.edit"
  | "team.manage"
  | "team.view"
  | "settings.app"
  | "assignments.edit"
  | "module.creative-request.edit"
  | "module.email-flows.edit"
  | "module.strategy.run"
  | "module.test-lab.edit"
  | "module.attraction-matrix.run"
  | "ai.invoke";

const ALL_ACTIONS: ReadonlyArray<Action> = [
  "client.create",
  "client.update",
  "client.archive",
  "client.view",
  "brief.commit",
  "brief.edit",
  "team.manage",
  "team.view",
  "settings.app",
  "assignments.edit",
  "module.creative-request.edit",
  "module.email-flows.edit",
  "module.strategy.run",
  "module.test-lab.edit",
  "module.attraction-matrix.run",
  "ai.invoke",
];

export const RoleActionMap: Record<Role, ReadonlySet<Action>> = {
  admin: new Set<Action>(ALL_ACTIONS),
  strategist: new Set<Action>([
    "client.view",
    "client.create",
    "client.update",
    "brief.commit",
    "brief.edit",
    "team.view",
    "assignments.edit",
    "module.creative-request.edit",
    "module.email-flows.edit",
    "module.strategy.run",
    "module.test-lab.edit",
    "module.attraction-matrix.run",
    "ai.invoke",
  ]),
  media_buyer: new Set<Action>([
    "client.view",
    "client.update",
    "team.view",
    "module.test-lab.edit",
    "ai.invoke",
  ]),
  designer: new Set<Action>([
    "client.view",
    "team.view",
    "module.creative-request.edit",
    "ai.invoke",
  ]),
  viewer: new Set<Action>(["client.view", "team.view"]),
};

export function isAllowed(role: Role, action: Action): boolean {
  return RoleActionMap[role].has(action);
}
