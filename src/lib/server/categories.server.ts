import { createServerFn } from "@tanstack/react-start";
import type { NewCategory } from "@/types/database";

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("./get-db");
  const { eq, asc } = await import("drizzle-orm");
  const { getOptionalSession } = await import("./auth-utils.server");
  const { categories } = await import("@/database/schema");

  const session = await getOptionalSession();
  if (!session) return { categories: [] };

  const db = await getDb();
  const result = await db.query.categories.findMany({
    where: eq(categories.userId, session.user.id),
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });

  return { categories: result };
});

type CreateCategoryData = {
  data: Omit<NewCategory, "id" | "userId" | "createdAt">;
};

export const createCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: CreateCategoryData) => {
    const { getDb } = await import("./get-db");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { categories } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const [newCategory] = await db
      .insert(categories)
      .values({
        ...ctx.data,
        userId: session.user.id,
      })
      .returning();

    return newCategory;
  }
);

type UpdateCategoryData = {
  data: { id: string } & Partial<Omit<NewCategory, "id" | "userId">>;
};

export const updateCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: UpdateCategoryData) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { categories } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    const { id, ...updateData } = ctx.data;

    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(and(eq(categories.id, id), eq(categories.userId, session.user.id)))
      .returning();

    if (!updatedCategory) throw new Error("Category not found");

    return updatedCategory;
  }
);

export const deleteCategory = createServerFn({ method: "POST" }).handler(
  async (ctx: { data: { id: string } }) => {
    const { getDb } = await import("./get-db");
    const { eq, and } = await import("drizzle-orm");
    const { getAuthenticatedSession } = await import("./auth-utils.server");
    const { categories } = await import("@/database/schema");

    const session = await getAuthenticatedSession();
    const db = await getDb();

    await db.delete(categories).where(and(eq(categories.id, ctx.data.id), eq(categories.userId, session.user.id)));

    return { success: true };
  }
);
