import { NextResponse, type NextRequest } from "next/server";
import { getHistory } from "@/lib/api";
import { RANGES, type Range } from "@/lib/types";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/history/[id]">) {
  const { id } = await ctx.params;
  const sp = req.nextUrl.searchParams;
  const range = (sp.get("range") ?? "1Y").toUpperCase() as Range;
  const symbol = (sp.get("symbol") ?? "").toLowerCase();
  const ref = Number(sp.get("ref"));

  if (!RANGES.includes(range) || !/^[a-z0-9]{1,20}$/.test(symbol) || !(ref > 0)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  try {
    // Round the reference so cache keys stay stable while the price ticks.
    const data = await getHistory(id, symbol, range, Number(ref.toPrecision(2)));
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load history" },
      { status: 502 },
    );
  }
}
