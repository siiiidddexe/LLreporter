import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DownloadsClient } from "@/components/DownloadsClient";

export default async function DownloadsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <DownloadsClient role={user.role} />;
}
