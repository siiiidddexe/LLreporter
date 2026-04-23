"use client";
import { useRouter } from "next/navigation";

export function SignOutButton({ everywhere = false }: { everywhere?: boolean }) {
  const router = useRouter();
  return (
    <button
      className="btn w-full justify-center"
      onClick={async () => {
        await fetch(everywhere ? "/api/auth/force-signout" : "/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
    >
      {everywhere ? "Sign out everywhere" : "Sign out"}
    </button>
  );
}
