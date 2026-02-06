export type OpenClawEventType =
  | "message_received"
  | "tool_result"
  | "approval_request"
  | "task_status_update";

export interface OpenClawChannelAdapter {
  sendMessage: (threadId: string, content: string) => Promise<void>;
  reportToolResult: (taskId: string, payload: Record<string, unknown>) => Promise<void>;
  requestApproval: (taskId: string, scopes: string[]) => Promise<void>;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
}
