import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { mapSale, saleInclude } from "@/lib/serializers";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const sale = await prisma.sale.findUnique({ where: { id }, include: saleInclude });
  if (!sale) return Response.json({ error: "Sale not found" }, { status: 404 });
  return Response.json(mapSale(sale));
}
