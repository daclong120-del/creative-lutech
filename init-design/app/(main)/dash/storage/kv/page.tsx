"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useState, Suspense } from "react";
import { StorageIcon } from "@/components/icons";

interface KvNamespace {
  id: string;
  name: string;
  keys: { key: string; value: string }[];
}

function KvPageContent() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");

  // --- Trạng thái quản lý KV Namespaces ---
  const [kvNamespaces, setKvNamespaces] = useState<KvNamespace[]>([
    {
      id: "kv-1",
      name: "USER_SESSIONS",
      keys: [
        { key: "session_token_99a8b", value: '{"userId":"usr-01","expires":1782965239}' },
        { key: "session_token_12x4z", value: '{"userId":"usr-02","expires":1782969910}' }
      ]
    },
    {
      id: "kv-2",
      name: "CONFIG_CACHE",
      keys: [
        { key: "maintenance_mode", value: "false" },
        { key: "max_upload_size_limit", value: "20971520" }
      ]
    }
  ]);
  const [selectedKvId, setSelectedKvId] = useState("kv-1");
  const [newKvName, setNewKvName] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  // Thêm Namespace mới
  const handleAddKvNamespace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKvName.trim()) return;
    const newNs: KvNamespace = {
      id: `kv-${Date.now()}`,
      name: newKvName.toUpperCase().replace(/\s+/g, "_"),
      keys: []
    };
    setKvNamespaces((prev) => [...prev, newNs]);
    setSelectedKvId(newNs.id);
    setNewKvName("");
  };

  // Thêm key-value pair mới vào Namespace hiện tại
  const handleAddKeyValuePair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    setKvNamespaces((prev) =>
      prev.map((ns) => {
        if (ns.id === selectedKvId) {
          return {
            ...ns,
            keys: [...ns.keys, { key: newKey.trim(), value: newValue.trim() }]
          };
        }
        return ns;
      })
    );
    setNewKey("");
    setNewValue("");
  };

  const activeKvNamespace = kvNamespaces.find((ns) => ns.id === selectedKvId) || kvNamespaces[0];

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
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-primary text-foreground"
        >
          Workers KV
        </Link>
        <Link
          href={`/dash/storage/d1${sectionParam ? `?section=${sectionParam}` : ""}`}
          className="px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer border-transparent text-muted-foreground hover:text-foreground"
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
        {/* Danh sách KV Namespaces */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground">KV Namespaces</h2>
          
          <div className="flex flex-col gap-3">
            {kvNamespaces.map((ns) => (
              <div
                key={ns.id}
                onClick={() => setSelectedKvId(ns.id)}
                className={`p-4 border rounded-xl cursor-pointer text-left transition-all duration-200 shadow-sm ${
                  selectedKvId === ns.id
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <h3 className="text-xs font-bold text-foreground font-mono">{ns.name}</h3>
                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground font-semibold">
                  <span>Keys: {ns.keys.length}</span>
                  <span>Status: Active</span>
                </div>
              </div>
            ))}
          </div>

          {/* Form tạo mới Namespace */}
          <form onSubmit={handleAddKvNamespace} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold text-foreground">Create Namespace</h3>
            <input
              type="text"
              placeholder="NAMESPACE_NAME"
              value={newKvName}
              onChange={(e) => setNewKvName(e.target.value)}
              className="w-full border border-border bg-muted/10 rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={!newKvName.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
            >
              Create
            </button>
          </form>
        </div>

        {/* Khám phá các Key của KV */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-foreground">
            Keys in <span className="font-mono text-primary">{activeKvNamespace.name}</span>
          </h2>

          <div className="rounded-xl border border-border bg-card p-5 space-y-6 shadow-sm">
            {/* Form ghi mới Key-Value pair */}
            <form onSubmit={handleAddKeyValuePair} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Key</label>
                <input
                  type="text"
                  placeholder="e.g. config_url"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full border border-border bg-muted/10 rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">Value (JSON/String)</label>
                <input
                  type="text"
                  placeholder='e.g. "https://..."'
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full border border-border bg-muted/10 rounded-lg p-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!newKey.trim() || !newValue.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold h-9 rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                Write Key
              </button>
            </form>

            {/* Bảng danh sách Keys */}
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-3 font-semibold">Key Name</th>
                    <th className="p-3 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeKvNamespace.keys.length > 0 ? (
                    activeKvNamespace.keys.map((pair, index) => (
                      <tr key={index} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-bold text-foreground font-mono">{pair.key}</td>
                        <td className="p-3 text-muted-foreground font-mono truncate max-w-[280px]" title={pair.value}>
                          {pair.value}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-muted-foreground">
                        No key-value pairs stored in this namespace.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <KvPageContent />
    </Suspense>
  );
}
