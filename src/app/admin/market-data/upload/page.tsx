import { redirect } from "next/navigation";
import { MarketDataUploadClient } from "@/components/admin/MarketDataUploadClient";
import { getServerSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export default async function MarketDataUploadPage() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") redirect("/demo-login?admin=1&next=/admin/market-data/upload");

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <MarketDataUploadClient />
    </section>
  );
}
