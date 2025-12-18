import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/database/db";
import { categories, type NewCategory } from "@/database/schema";
import { auth } from "@/lib/auth";

async function getSession() {
  const request = getRequest();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

export const getCategories = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getSession();
  if (!session?.user) return { categories: [] };

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

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
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");

    await db.delete(categories).where(and(eq(categories.id, ctx.data.id), eq(categories.userId, session.user.id)));

    return { success: true };
  }
);
