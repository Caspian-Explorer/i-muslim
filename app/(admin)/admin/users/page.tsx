import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/PageHeader";
import { UsersPageClient } from "@/components/admin/users/UsersPageClient";
import { fetchUsers } from "@/lib/admin/data/users";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const { users, source } = await fetchUsers();

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={
          source === "firestore"
            ? "Live from Firestore."
            : "Sample data — configure Firebase Admin to see live users."
        }
      />
      <UsersPageClient initialUsers={users} source={source} />
    </div>
  );
}
