import Link from "next/link";

export default function NotFound() {
  return (
    <div className="glass mx-auto mt-16 max-w-md rounded-2xl p-10 text-center">
      <p className="text-5xl">🪙</p>
      <h1 className="mt-4 text-xl font-semibold">Coin not found</h1>
      <p className="mt-1 text-sm text-muted">We couldn&apos;t find that cryptocurrency.</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-gradient-to-br from-accent to-accent-2 px-4 py-2 text-sm font-medium text-white">
        Back to market
      </Link>
    </div>
  );
}
