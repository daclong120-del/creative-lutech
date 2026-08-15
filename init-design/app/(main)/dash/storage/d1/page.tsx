"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import { useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import { StorageIcon } from "@/components/icons";

interface D1Database {
  id: string;
  name: string;
  size: string;
}

interface D1UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
}

function D1PageContent() {
  const { activeAccount } = useAccount();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");

  // --- Trạng thái quản lý cơ sở dữ liệu D1 ---
  const [databases] = useState<D1Database[]>([
    { id: "d1-1", name: "cloudflare-prod-db", size: "142 MB" },
    { id: "d1-2", name: "test-auth-db", size: "12 MB" }
  ]);
  const [selectedD1Id] = useState("d1-1");
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 3;");
  const [sqlResult, setSqlResult] = useState<D1UserRow[] | string | null>(null);

  // Chạy câu lệnh SQL giả lập
  const handleRunSQL = () => {
    const cleanQuery = sqlQuery.trim().toLowerCase();
    if (cleanQuery.includes("select * from users")) {
      setSqlResult([
        { id: 1, name: activeAccount, email: `${activeAccount}@cloudflare.com`, role: "Owner" },
        { id: 2, name: "backup-admin", email: "backup-admin@cloudflare.com", role: "Administrator" },
        { id: 3, name: "api-service-bot", email: "api-bot@cloudflare.com", role: "Service Token" }
      ]);
    } else {
      setSqlResult("Query executed successfully. 0 rows affected.");
    }
  };

  const activeD1Db = databases.find((db) => db.id === selectedD1Id) || databases[0];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-8 w-full animate-in fade-in duration-200">
      {/* Hero Header chính */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 select-none">
          <StorageIcon size={24} className="text-cloudflare-orange" />
          {sectionParam === "workers" ? "Workers & Pages" : "Storage & Databases"}
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage fast KV namespaces, query serverless SQL tables via D1, and upload raw assets into R2 object storage.
        </p>
      </div>

      {/* Các tab chuyển hướng */}
      <div className="flex border-b border-border select-none">
        <Link
          href={`/dash/storage/kv${sectionParam ? `?section=${sectionParam}` : ""}`}
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-transparent text-muted-foreground hover:text-foreground"
        >
          Workers KV
        </Link>
        <Link
          href={`/dash/storage/d1${sectionParam ? `?section=${sectionParam}` : ""}`}
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-primary text-foreground"
        >
          D1 SQL Databases
        </Link>
        <Link
          href={`/dash/storage/r2${sectionParam ? `?section=${sectionParam}` : ""}`}
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-transparent text-muted-foreground hover:text-foreground"
        >
          R2 Object Storage
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột hiển thị chi tiết DB */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground">Databases</h2>
          <div className="p-4 border border-primary bg-primary/5 dark:bg-primary/10 rounded-xl space-y-4 shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Database Name</span>
              <h3 className="text-xs font-bold text-foreground font-mono">{activeD1Db.name}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground">Size on Disk</span>
                <p className="font-bold text-foreground font-mono">{activeD1Db.size}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Provider</span>
                <p className="font-bold text-foreground">Cloudflare SQLite</p>
              </div>
            </div>
          </div>
        </div>

        {/* Khung Console SQL chính */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-foreground">SQL Query Console</h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Execute SQLite Statements</span>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={4}
                className="w-full border border-border bg-muted/15 font-mono text-xs text-foreground p-3 rounded-lg focus:outline-none focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground select-none">
                Try typing: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-bold">SELECT * FROM users</code>
              </span>
              <button
                onClick={handleRunSQL}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Run Query
              </button>
            </div>

            {/* Bảng kết quả truy vấn SQL */}
            {sqlResult && (
              <div className="space-y-2 border-t border-border pt-4">
                <span className="text-xs font-semibold text-muted-foreground">Query Result</span>
                <div className="rounded-lg border border-border bg-muted/20 overflow-x-auto">
                  {typeof sqlResult === "string" ? (
                    <div className="p-4 text-xs text-muted-foreground font-mono leading-relaxed">{sqlResult}</div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse min-w-[450px]">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold select-none">
                          <th className="p-3 font-semibold">ID</th>
                          <th className="p-3 font-semibold">Username</th>
                          <th className="p-3 font-semibold">Email</th>
                          <th className="p-3 font-semibold">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sqlResult.map((row) => (
                          <tr key={row.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3 font-bold text-foreground font-mono">{row.id}</td>
                            <td className="p-3 text-foreground font-bold">{row.name}</td>
                            <td className="p-3 text-muted-foreground font-mono">{row.email}</td>
                            <td className="p-3 text-muted-foreground">{row.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function D1Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <D1PageContent />
    </Suspense>
  );
}
