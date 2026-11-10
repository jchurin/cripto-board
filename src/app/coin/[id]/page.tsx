import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CoinView } from "@/components/CoinView";
import { getCoin } from "@/lib/api";

export default function CoinPage({ params }: PageProps<"/coin/[id]">) {
  return (
    <Suspense fallback={<CoinSkeleton />}>
      <CoinContent params={params} />
    </Suspense>
  );
}

async function CoinContent({ params }: { params: PageProps<"/coin/[id]">["params"] }) {
  const { id } = await params;
  const coin = await getCoin(id);
  if (!coin) notFound();
  return <CoinView coin={coin} />;
}

function CoinSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-4 w-20" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="skeleton size-16 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
        <div className="skeleton h-12 w-56" />
      </div>
      <div className="glass h-[560px] rounded-2xl p-6">
        <div className="skeleton h-full w-full" />
      </div>
    </div>
  );
}
