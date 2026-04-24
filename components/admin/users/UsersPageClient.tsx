"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, BadgeCheck, ChevronLeft, ChevronRight, Download, Mail, MoreHorizontal, Plus, Search, ShieldX, Trash2, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { toast } from "@/components/ui/sonner";
import { cn, formatRelative, initials } from "@/lib/utils";
import type { AdminUser, AdminRole, AdminUserStatus } from "@/types/admin";
import { InviteUserDrawer } from "./InviteUserDrawer";

const PAGE_SIZES = [10, 25, 50, 100];

const ROLE_OPTIONS: Array<{ value: AdminRole | "all"; label: string }> = [
  { value: "all", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
  { value: "scholar", label: "Scholar" },
  { value: "member", label: "Member" },
];

const STATUS_OPTIONS: Array<{ value: AdminUserStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "banned", label: "Banned" },
];

function roleVariant(role: AdminRole): "accent" | "info" | "success" | "neutral" {
  if (role === "admin") return "accent";
  if (role === "moderator") return "info";
  if (role === "scholar") return "success";
  return "neutral";
}

function statusVariant(status: AdminUserStatus): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "suspended" || status === "banned") return "danger";
  return "neutral";
}

export function UsersPageClient({
  initialUsers,
  source,
}: {
  initialUsers: AdminUser[];
  source: "firestore" | "mock";
}) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<AdminRole | "all">("all");
  const [status, setStatus] = useState<AdminUserStatus | "all">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [bulkDelete, setBulkDelete] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (status !== "all" && u.status !== status) return false;
      if (verifiedOnly && !u.verified) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [users, query, role, status, verifiedOnly]);

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all"
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        size: 32,
      },
      {
        id: "user",
        accessorFn: (u) => u.name,
        header: "User",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt="" />}
                <AvatarFallback>{initials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                  <span className="truncate">{u.name}</span>
                  {u.verified && (
                    <BadgeCheck className="size-3.5 text-primary shrink-0" aria-label="Verified" />
                  )}
                </div>
                <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={roleVariant(row.original.role)} className="capitalize">
            {row.original.role}
          </Badge>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)} className="capitalize">
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "joined",
        accessorFn: (u) => new Date(u.joinedAt).getTime(),
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatRelative(row.original.joinedAt)}
          </span>
        ),
      },
      {
        id: "lastActive",
        accessorFn: (u) => new Date(u.lastActiveAt).getTime(),
        header: "Last active",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatRelative(row.original.lastActiveAt)}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div onClick={(e) => e.stopPropagation()} className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Actions for ${u.name}`}>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setDetailUser(u)}>
                    <UserCog /> View profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      toast("Password reset email sent (mock).");
                    }}
                  >
                    <Mail /> Reset password
                  </DropdownMenuItem>
                  {u.status !== "suspended" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setUsers((prev) =>
                          prev.map((p) =>
                            p.id === u.id ? { ...p, status: "suspended" as const } : p,
                          ),
                        );
                        toast.success(`${u.name} suspended.`);
                      }}
                    >
                      <ShieldX /> Suspend
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="danger" onClick={() => setDeleteTarget(u)}>
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        size: 48,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
    },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const selectedCount = selectedIds.length;

  function exportCsv(rows: AdminUser[]) {
    const header = ["id", "name", "email", "role", "status", "verified", "joinedAt", "lastActiveAt"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [r.id, r.name, r.email, r.role, r.status, r.verified, r.joinedAt, r.lastActiveAt]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyBulkStatus(next: AdminUserStatus) {
    setUsers((prev) =>
      prev.map((u) => (selectedIds.includes(u.id) ? { ...u, status: next } : u)),
    );
    setRowSelection({});
    toast.success(`Updated ${selectedCount} user${selectedCount === 1 ? "" : "s"}.`);
  }

  function applyBulkRole(next: AdminRole) {
    setUsers((prev) =>
      prev.map((u) => (selectedIds.includes(u.id) ? { ...u, role: next } : u)),
    );
    setRowSelection({});
    toast.success(`Role changed for ${selectedCount} user${selectedCount === 1 ? "" : "s"}.`);
  }

  function applyBulkDelete() {
    setUsers((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
    setRowSelection({});
    setBulkDelete(false);
    toast.success(`Deleted ${selectedCount} user${selectedCount === 1 ? "" : "s"}.`);
  }

  function handleDeleteOne() {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success(`${name} deleted.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 w-64"
            aria-label="Search users"
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole | "all")}
          aria-label="Filter by role"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as AdminUserStatus | "all")}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={verifiedOnly}
            onCheckedChange={(v) => setVerifiedOnly(Boolean(v))}
          />
          Verified only
        </label>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
          >
            <Download /> Export CSV
          </Button>
          <Button size="sm" onClick={() => setInviteOpen(true)} disabled={source === "mock"}>
            <Plus /> Invite user
          </Button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{selectedCount} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm">Change role</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["admin", "moderator", "scholar", "member"] as const).map((r) => (
                  <DropdownMenuItem key={r} onClick={() => applyBulkRole(r)} className="capitalize">
                    {r}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                toast("Emails queued (mock).");
                setRowSelection({});
              }}
            >
              <Mail /> Email
            </Button>
            <Button variant="secondary" size="sm" onClick={() => applyBulkStatus("suspended")}>
              <ShieldX /> Suspend
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                exportCsv(users.filter((u) => selectedIds.includes(u.id)))
              }
            >
              <Download /> Export
            </Button>
            <Button variant="danger" size="sm" onClick={() => setBulkDelete(true)}>
              <Trash2 /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-muted/40 text-left">
                  {hg.headers.map((h) => {
                    const canSort = h.column.getCanSort();
                    const sortState = h.column.getIsSorted();
                    return (
                      <th
                        key={h.id}
                        scope="col"
                        className={cn(
                          "px-3 py-2 font-medium text-xs uppercase tracking-wide text-muted-foreground",
                          canSort && "cursor-pointer select-none",
                        )}
                        onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                        style={{ width: h.getSize() ? h.getSize() : undefined }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {canSort && (
                            <span className="text-muted-foreground/70">
                              {sortState === "asc" ? (
                                <ArrowUp className="size-3" />
                              ) : sortState === "desc" ? (
                                <ArrowDown className="size-3" />
                              ) : (
                                <ArrowUpDown className="size-3" />
                              )}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const selected = row.getIsSelected();
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "border-b border-border last:border-b-0 hover:bg-muted/40 cursor-pointer",
                        selected && "bg-primary/5",
                      )}
                      onClick={() => setDetailUser(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Rows per page</span>
            <select
              className="h-7 rounded-md border border-input bg-background px-1"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground tabular-nums">
            <span>
              {table.getRowModel().rows.length === 0
                ? "0"
                : `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, filtered.length)}`}{" "}
              of {filtered.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous page"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next page"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <InviteUserDrawer
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={(u) => {
          setUsers((prev) => [u, ...prev]);
          toast.success(`Invite sent to ${u.email}.`);
        }}
      />

      <UserDetailSheet
        user={detailUser}
        onOpenChange={(next) => !next && setDetailUser(null)}
        onDelete={(u) => {
          setDetailUser(null);
          setDeleteTarget(u);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => !next && setDeleteTarget(null)}
        title="Delete user"
        description={
          deleteTarget
            ? `This permanently deletes ${deleteTarget.name}. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmWord={deleteTarget?.name}
        onConfirm={handleDeleteOne}
      />

      <ConfirmDialog
        open={bulkDelete}
        onOpenChange={setBulkDelete}
        title={`Delete ${selectedCount} users`}
        description="This permanently deletes the selected users. This cannot be undone."
        confirmLabel={`Delete ${selectedCount}`}
        confirmWord={`delete ${selectedCount}`}
        onConfirm={applyBulkDelete}
      />
    </div>
  );
}

function UserDetailSheet({
  user,
  onOpenChange,
  onDelete,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (u: AdminUser) => void;
}) {
  return (
    <Sheet open={Boolean(user)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>User profile</SheetTitle>
          <SheetDescription>
            View activity and contributions. Manage roles and status.
          </SheetDescription>
        </SheetHeader>
        {user && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1 text-base font-semibold text-foreground">
                  {user.name}
                  {user.verified && <BadgeCheck className="size-4 text-primary" aria-label="Verified" />}
                </div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant={roleVariant(user.role)} className="capitalize">{user.role}</Badge>
              <Badge variant={statusVariant(user.status)} className="capitalize">{user.status}</Badge>
            </div>

            <Tabs defaultValue="profile" className="mt-6">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="donations">Donations</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="space-y-3 pt-3">
                <Row label="User ID" value={user.id} mono />
                <Row label="Joined" value={new Date(user.joinedAt).toLocaleString()} />
                <Row label="Last active" value={new Date(user.lastActiveAt).toLocaleString()} />
                <Row label="Email verified" value={user.verified ? "Yes" : "No"} />
              </TabsContent>
              <TabsContent value="activity" className="pt-3 text-sm text-muted-foreground">
                Activity timeline is coming in a later phase.
              </TabsContent>
              <TabsContent value="content" className="pt-3 text-sm text-muted-foreground">
                Contributed articles, comments, and Q&amp;A answers will appear here.
              </TabsContent>
              <TabsContent value="donations" className="pt-3 text-sm text-muted-foreground">
                No donations yet.
              </TabsContent>
            </Tabs>

            <div className="mt-8 rounded-md border border-danger/30 bg-danger/5 p-4">
              <h3 className="text-sm font-semibold text-danger">Danger zone</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Deleting a user removes all their data from the directory.
              </p>
              <div className="mt-3">
                <Button variant="danger" size="sm" onClick={() => onDelete(user)}>
                  <Trash2 /> Delete user
                </Button>
              </div>
            </div>
          </div>
        )}
        <SheetFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-foreground", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
