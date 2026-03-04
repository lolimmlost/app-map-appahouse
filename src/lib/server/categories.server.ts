import { createServerFn } from "@tanstack/react-start";
import type { NewCategory } from "@/types/database";

/**
 * Get all categories for the current user
 */
export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { getOptionalSession } = await import("./auth-utils.server");
  const { getCategoryRepository } = await import("./repositories");

  const session = await getOptionalSession();
  if (!session) return { categories: [] };

  const categoryRepo = getCategoryRepository();
  const result = await categoryRepo.findAll(session.user.id);

  return { categories: result };
});

type CreateCategoryData = {
  data: Omit<NewCategory, "id" | "userId" | "createdAt">;
};

/**
 * Create a new category
 */
export const createCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateCategoryData) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { getCategoryRepository } = await import("./repositories");

    const session = await getAuthenticatedSession();
    const categoryRepo = getCategoryRepository();

    const newCategory = await categoryRepo.create({
      ...ctx.data,
      userId: session.user.id,
    });

    return newCategory;
  }
);

type UpdateCategoryData = {
  data: { id: string } & Partial<Omit<NewCategory, "id" | "userId">>;
};

/**
 * Update an existing category
 */
export const updateCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateCategoryData) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { getCategoryRepository } = await import("./repositories");

    const session = await getAuthenticatedSession();
    const categoryRepo = getCategoryRepository();

    const { id, ...updateData } = ctx.data;

    const updatedCategory = await categoryRepo.update(id, session.user.id, updateData);

    if (!updatedCategory) throw new Error("Category not found");

    return updatedCategory;
  }
);

/**
 * Delete a category
 */
export const deleteCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { getCategoryRepository } = await import("./repositories");

    const session = await getAuthenticatedSession();
    const categoryRepo = getCategoryRepository();

    await categoryRepo.delete(ctx.data.id, session.user.id);

    return { success: true };
  }
);
