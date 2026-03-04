"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_DEVICE_ID = "1";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/device/${encodeURIComponent(DEFAULT_DEVICE_ID)}`);
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <p className="text-[#555] text-sm">Redirecting to device {DEFAULT_DEVICE_ID}…</p>
    </main>
  );
}
