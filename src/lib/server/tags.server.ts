import { createServerFn } from "@tanstack/react-start";
import type { NewTag } from "@/types/database";

/**
 * Get all tags for the current user
 */
export const getTags = createServerFn({ method: "GET" }).handler(async () => {
  const { getOptionalSession } = await import("./auth-utils.server");
  const { getTagRepository } = await import("./repositories");

  const session = await getOptionalSession();
  if (!session) return { tags: [] };

  const tagRepo = getTagRepository();
  const result = await tagRepo.findAll(session.user.id);

  return { tags: result };
});

type CreateTagData = {
  data: Omit<NewTag, "id" | "userId" | "createdAt">;
};

/**
 * Create a new tag
 */
export const createTag = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateTagData) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { getTagRepository } = await import("./repositories");

    const session = await getAuthenticatedSession();
    const tagRepo = getTagRepository();

    const newTag = await tagRepo.create({
      ...ctx.data,
      userId: session.user.id,
    });

    return newTag;
  }
);

type UpdateTagData = {
  data: { id: string } & Partial<Omit<NewTag, "id" | "userId">>;
};

/**
 * Update an existing tag
 */
export const updateTag = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateTagData) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { getTagRepository } = await import("./repositories");

    const session = await getAuthenticatedSession();
    const tagRepo = getTagRepository();

    const { id, ...updateData } = ctx.data;

    const updatedTag = await tagRepo.update(id, session.user.id, updateData);

    if (!updatedTag) throw new Error("Tag not found");

    return updatedTag;
  }
);

/**
 * Delete a tag
 */
export const deleteTag = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { getTagRepository } = await import("./repositories");

    const session = await getAuthenticatedSession();
    const tagRepo = getTagRepository();

    await tagRepo.delete(ctx.data.id, session.user.id);

    return { success: true };
  }
);
