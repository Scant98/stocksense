import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/suppliers/[id]">
) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    ...supplier,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  });
}

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/suppliers/[id]">
) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        country: body.country,
        rating: body.rating,
        status: body.status,
      },
    });

    return Response.json({
      ...supplier,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/suppliers/[id]">
) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    await prisma.supplier.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
