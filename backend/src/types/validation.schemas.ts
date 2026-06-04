import { z } from "zod";
import { ProjectStatus, ArtifactType } from "@prisma/client";

// ==================== Project Schemas ====================

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be <= 100 characters"),
  description: z.string().optional(),
  platform: z.enum(["web", "ios", "android", "wechat"]),
  config: z.record(z.unknown()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  platform: z.enum(["web", "ios", "android", "wechat"]).optional(),
  config: z.record(z.unknown()).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export const projectQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
  status: z.string().optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const transitionStatusSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
});

// ==================== Pipeline Schemas ====================

export const createPipelineSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
});

export const updateNodeStatusSchema = z.object({
  status: z.string().min(1, "status is required"),
  output: z.object({
    success: z.boolean(),
    data: z.record(z.unknown()).optional(),
    error: z.string().optional(),
    logs: z.array(z.string()).optional(),
  }).optional(),
});

// ==================== Artifact Schemas ====================

export const createArtifactSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  name: z.string().min(1, "Name is required").max(200),
  type: z.nativeEnum(ArtifactType),
  filePath: z.string().min(1, "filePath is required"),
  fileSize: z.number().optional(),
  checksum: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateArtifactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  checksum: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
