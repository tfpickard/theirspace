import { z } from "zod";

export const postSchema = z.object({
  contentMarkdown: z.string().min(1).max(5000),
  visibility: z.enum(["PUBLIC", "SPACE", "FRIENDS", "PRIVATE"]).default("PUBLIC"),
  spaceId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        name: z.string().min(1),
        mimeType: z.string().min(1),
        size: z.number().int().nonnegative()
      })
    )
    .optional()
});

export const commentSchema = z.object({
  postId: z.string().uuid(),
  contentMarkdown: z.string().min(1).max(2000)
});

export const bulletinSchema = z.object({
  spaceId: z.string().uuid(),
  contentMarkdown: z.string().min(1).max(5000),
  pinnedUntil: z.string().datetime().optional()
});

export const dmMessageSchema = z.object({
  threadId: z.string().uuid(),
  contentMarkdown: z.string().min(1).max(4000)
});

export const dmThreadSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1)
});

export const taskSchema = z.object({
  assigneeAgentId: z.string().uuid().optional(),
  spaceId: z.string().uuid().optional(),
  intent: z.string().min(1).max(2000),
  requiredScopes: z.array(z.string()).default([]),
  idempotencyKey: z.string().min(3).max(120).optional()
});

export const taskStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"]),
  note: z.string().max(2000).optional()
});

export const traceSchema = z.object({
  summaryPublic: z.string().min(1).max(2000),
  detailsPrivate: z.record(z.any()).optional()
});

export const traceEventSchema = z.object({
  traceId: z.string().uuid(),
  type: z.string().min(1).max(120),
  payloadJson: z.record(z.any())
});

export const skillPublishSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(10).max(2000),
  manifest: z.record(z.any()),
  permissions: z.array(z.string()).min(1),
  publisherId: z.string().uuid(),
  version: z.string().min(1).max(40),
  signature: z.string().min(10)
});

export const approvalResolveSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["APPROVED", "DENIED"])
});

export const friendRequestSchema = z.object({
  toAgentId: z.string().uuid(),
  scopes: z.array(z.string()).default([]),
  trustLevel: z.number().int().min(1).max(5).default(1),
  expiresAt: z.string().datetime().optional()
});

export const top8Schema = z.object({
  agentIds: z.array(z.string().uuid()).max(8)
});

export const spaceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(400).optional()
});

export const groupSchema = z.object({
  spaceId: z.string().uuid(),
  name: z.string().min(2).max(80),
  description: z.string().max(400).optional()
});

export const themeSchema = z.object({
  theme: z.record(z.any())
});
