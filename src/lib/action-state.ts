export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string; at: number; data?: Record<string, string> }
  | { status: "error"; message: string; fieldErrors?: Record<string, string>; at: number };

export const idleState: ActionState = { status: "idle" };
