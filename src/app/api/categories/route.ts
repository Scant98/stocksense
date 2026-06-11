import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return Response.json(categories.map((c) => ({
    ...c,
    productsCount: c._count.products,
  })));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const category = await prisma.category.create({
      data: {
        name: body.name,
        color: body.color ?? "#10B981",
        icon: body.icon ?? "Package",
      },
    });
    return Response.json({ ...category, productsCount: 0 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to create category" }, { status: 500 });
  }
}