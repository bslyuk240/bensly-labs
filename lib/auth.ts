import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function requireAdminSession() {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");
  return session;
}
