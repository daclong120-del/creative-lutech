"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account-context";
import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { AiIcon, SearchIcon } from "@/components/icons";

interface Model {
  id: string;
  name: string;
  category: "Text" | "Image" | "Audio";
  description: string;
  status: "Active" | "Idle";
}

interface VectorIndex {
  name: string;
  dimensions: number;
  metric: "Cosine" | "L2" | "Dot Product";
  vectors: number;
  created: string;
  status: "Active" | "Provisioning";
}

interface GatewayLog {
  time: string;
  provider: string;
  model: string;
  status: number;
  duration: string;
  tokens: number;
  cached: boolean;
}

// ==========================================
// 1. WORKERS AI HUB PLAYGROUND VIEW
// ==========================================
function WorkersAiHubView() {
  const [selectedModelId, setSelectedModelId] = useState("llama-3");
  const [prompt, setPrompt] = useState("Explain quantum computing in one sentence.");
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [gpuUsage, setGpuUsage] = useState(12);

  const models: Model[] = [
    {
      id: "llama-3",
      name: "@cf/meta/llama-3-8b-instruct",
      category: "Text",
      description: "Highly capable conversational LLM optimized for dialogue and general queries.",
      status: "Active",
    },
    {
      id: "mistral-7b",
      name: "@cf/mistral/mistral-7b-instruct-v0.1",
      category: "Text",
      description: "Dense transformer model suited for code creation and summarization tasks.",
      status: "Idle",
    },
    {
      id: "stable-diffusion",
      name: "@cf/stabilityai/stable-diffusion-xl-base-1.0",
      category: "Image",
      description: "State-of-the-art latent diffusion model generating ultra-detailed artwork from prompts.",
      status: "Active",
    },
    {
      id: "whisper-asr",
      name: "@cf/openai/whisper-tiny-en",
      category: "Audio",
      description: "Robust automatic speech recognition model for audio transcribing and translating.",
      status: "Idle",
    }
  ];

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  const generateSimulatedResult = useCallback(() => {
    if (selectedModelId === "llama-3") {
      setResult(
        "Quantum computing is a type of computation that harnesses the collective properties of quantum mechanics—such as superposition, interference, and entanglement—to perform calculations exponentially faster than classical computers."
      );
    } else if (selectedModelId === "mistral-7b") {
      setResult(
        "Quantum computing solves complex calculations using quantum bits (qubits) which can represent a 0, 1, or both simultaneously, bypassing traditional linear processing limits."
      );
    } else if (selectedModelId === "stable-diffusion") {
      setResult("__IMAGE_STABLE_DIFFUSION__");
    } else if (selectedModelId === "whisper-asr") {
      setResult(
        "[00:00 - 00:04]: Hello and welcome to Cloudflare Workers AI.\n[00:04 - 00:08]: Running large models at the edge is fast, cheap, and simple."
      );
    }
  }, [selectedModelId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsRunning(false);
            setGpuUsage(12);
            generateSimulatedResult();
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isRunning, generateSimulatedResult]);

  const handleModelSelect = (id: string) => {
    setSelectedModelId(id);
    setResult(null);
    setProgress(0);
    setGpuUsage(12);
    if (id === "llama-3" || id === "mistral-7b") {
      setPrompt("Explain quantum computing in one sentence.");
    } else if (id === "stable-diffusion") {
      setPrompt("A futuristic cityscape with flying vehicles and glowing orange neon lights, high fidelity.");
    } else if (id === "whisper-asr") {
      setPrompt("sample_recording_voice.wav (Click run to transcribe audio file)");
    }
  };

  const handleRunModel = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setGpuUsage(84);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Resource Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">GPU Allocation</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">{gpuUsage}%</span>
            <span className="text-[10px] text-muted-foreground font-medium">of 100 Cores</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-cloudflare-orange transition-all duration-300"
              style={{ width: `${gpuUsage}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Inference Requests</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">142,590</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">+18.5%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Last 30 days usage</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Instances</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">
              {models.filter((m) => m.status === "Active").length}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">/{models.length} Cached</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Hot-standby edge nodes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Model Catalog */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground select-none">Model Directory</h2>
          
          <div className="flex flex-col gap-3">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => handleModelSelect(model.id)}
                className={`p-4 border rounded-xl cursor-pointer text-left transition-all duration-200 shadow-sm ${
                  selectedModelId === model.id
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-foreground font-mono truncate max-w-[190px]">
                    {model.name.split("/").pop()}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                      model.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {model.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                  {model.description}
                </p>
                <div className="mt-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                  Category: {model.category}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playground Console */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-foreground select-none">Playground Console</h2>

          <div className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Running model</span>
                <h3 className="text-xs font-bold text-foreground font-mono">{selectedModel.name}</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-foreground self-start sm:self-center border border-border">
                {selectedModel.category}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Prompt / Input Payload</label>
              {selectedModel.category === "Audio" ? (
                <div className="border border-border bg-muted/20 rounded-lg p-4 flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs text-foreground font-mono">{prompt}</span>
                </div>
              ) : (
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isRunning}
                  rows={3}
                  className="w-full border border-border bg-muted/10 rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-200 font-medium"
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleRunModel}
                disabled={isRunning || !prompt.trim()}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-5 py-2.5 rounded-lg disabled:opacity-50 cursor-pointer transition-colors shadow-sm shrink-0"
              >
                {isRunning ? "Running..." : "Run Model"}
              </button>

              {isRunning && (
                <div className="w-full flex items-center gap-3">
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground font-mono">{progress}%</span>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-6">
              <label className="text-xs font-semibold text-muted-foreground">Inference Output</label>
              <div className="rounded-lg border border-border bg-muted/30 p-4 min-h-[120px] flex flex-col justify-center">
                {result ? (
                  result === "__IMAGE_STABLE_DIFFUSION__" ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-4 select-none">
                      <div className="w-64 h-36 rounded-lg bg-gradient-to-tr from-orange-500 via-rose-500 to-indigo-600 shadow-md animate-pulse relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
                        <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                          stabilityai/stable-diffusion-xl
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Generated image mockup xl-base-1.0</span>
                    </div>
                  ) : (
                    <pre className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap font-sans">
                      {result}
                    </pre>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground text-center select-none">
                    {isRunning ? "Waiting for edge GPU response..." : "Configure prompt and click Run Model to see prediction results."}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. VECTORIZE INDEXES VIEW
// ==========================================
function VectorizeView() {
  const [indexes, setIndexes] = useState<VectorIndex[]>([
    {
      name: "wiki-embeddings",
      dimensions: 1536,
      metric: "Cosine",
      vectors: 750000,
      created: "2 hours ago",
      status: "Active",
    },
    {
      name: "product-catalog-search",
      dimensions: 768,
      metric: "Cosine",
      vectors: 420210,
      created: "3 days ago",
      status: "Active",
    },
    {
      name: "user-context-cache",
      dimensions: 384,
      metric: "L2",
      vectors: 84320,
      created: "2 weeks ago",
      status: "Active",
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDimensions, setNewDimensions] = useState(1536);
  const [newMetric, setNewMetric] = useState<"Cosine" | "L2" | "Dot Product">("Cosine");

  const handleCreateIndex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newIdx: VectorIndex = {
      name: newName.toLowerCase().replace(/\s+/g, "-"),
      dimensions: Number(newDimensions),
      metric: newMetric,
      vectors: 0,
      created: "Just now",
      status: "Active"
    };

    setIndexes((prev) => [newIdx, ...prev]);
    setNewName("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Indexes</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">{indexes.length}</span>
            <span className="text-[10px] text-muted-foreground">Distributed globally</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Vectors Indexed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">
              {indexes.reduce((sum, idx) => sum + idx.vectors, 0).toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">High-performance semantic query ready</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Query Latency (p95)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">8.4ms</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">Excellent</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Global edge node replica routes</p>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search vector indexes..."
              className="w-full pl-9 pr-4 py-2 border border-border bg-muted/10 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap self-start sm:self-center"
          >
            Create Index
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground font-semibold">
                  <th className="p-4 font-semibold">Index Name</th>
                  <th className="p-4 font-semibold">Dimensions</th>
                  <th className="p-4 font-semibold">Distance Metric</th>
                  <th className="p-4 font-semibold">Vectors</th>
                  <th className="p-4 font-semibold">Created</th>
                  <th className="p-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {indexes.map((idx, index) => (
                  <tr key={index} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-bold text-foreground font-mono">{idx.name}</td>
                    <td className="p-4 text-muted-foreground font-mono">{idx.dimensions}</td>
                    <td className="p-4">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-muted text-foreground border border-border">
                        {idx.metric}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono">{idx.vectors.toLocaleString()}</td>
                    <td className="p-4 text-muted-foreground">{idx.created}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Giả lập tạo mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md border border-border bg-card rounded-xl shadow-lg p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Create Vector Index</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateIndex} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Index Name</label>
                <input
                  type="text"
                  placeholder="e.g. docs-embeddings"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-border bg-muted/10 rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Dimensions</label>
                  <select
                    value={newDimensions}
                    onChange={(e) => setNewDimensions(Number(e.target.value))}
                    className="w-full border border-border bg-muted/10 rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors font-mono"
                  >
                    <option value={384}>384 (MiniLM-L6)</option>
                    <option value={768}>768 (Mistral/BGE)</option>
                    <option value={1536}>1536 (OpenAI ADA)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Metric</label>
                  <select
                    value={newMetric}
                    onChange={(e) => setNewMetric(e.target.value as "Cosine" | "L2" | "Dot Product")}
                    className="w-full border border-border bg-muted/10 rounded-lg p-2.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  >
                    <option value="Cosine">Cosine</option>
                    <option value="L2">L2 (Euclidean)</option>
                    <option value="Dot Product">Dot Product</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  Create Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. AI GATEWAY VIEW
// ==========================================
function AiGatewayView() {
  const [logs] = useState<GatewayLog[]>([
    {
      time: "Just now",
      provider: "OpenAI",
      model: "gpt-4-turbo",
      status: 200,
      duration: "410ms",
      tokens: 382,
      cached: false,
    },
    {
      time: "1 min ago",
      provider: "Workers AI",
      model: "llama-3-8b-instruct",
      status: 200,
      duration: "84ms",
      tokens: 154,
      cached: true,
    },
    {
      time: "5 mins ago",
      provider: "Anthropic",
      model: "claude-3-opus",
      status: 200,
      duration: "956ms",
      tokens: 1042,
      cached: false,
    },
    {
      time: "12 mins ago",
      provider: "Workers AI",
      model: "llama-3-8b-instruct",
      status: 200,
      duration: "92ms",
      tokens: 210,
      cached: true,
    },
    {
      time: "24 mins ago",
      provider: "OpenAI",
      model: "gpt-3.5-turbo",
      status: 200,
      duration: "180ms",
      tokens: 92,
      cached: false,
    }
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Gateway Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 select-none">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Requests</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">849,120</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Last 30 days active traffic</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cached Requests</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">280,210</span>
            <span className="text-[10px] text-blue-500 font-bold font-mono">33.0%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Fast edge cache responses</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Savings</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">$1,698.24</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">+12%</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Provider API cost bypassed</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Error Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">0.02%</span>
            <span className="text-[10px] text-emerald-500 font-semibold font-mono">Healthy</span>
          </div>
          <p className="text-[10px] text-muted-foreground">Automated provider fallback active</p>
        </div>
      </div>

      {/* Gateway API Endpoint Info */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm select-none">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Gateway Configuration</h3>
        <p className="text-xs text-muted-foreground">
          Use the universal AI Gateway endpoint in your application code to automatically gain caching, rate limiting, and analytics.
        </p>

        <div className="p-4 bg-muted/30 border border-border rounded-xl font-mono text-xs text-foreground break-all select-all">
          https://gateway.ai.cloudflare.com/v1/production-gateway
        </div>
      </div>

      {/* Analytics logs */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground select-none">Recent Request Logs</h3>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-muted-foreground font-semibold">
                  <th className="p-4 font-semibold">Time</th>
                  <th className="p-4 font-semibold">Provider</th>
                  <th className="p-4 font-semibold">Model</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 font-semibold">Tokens</th>
                  <th className="p-4 font-semibold">Cached</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log, index) => (
                  <tr key={index} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 text-muted-foreground">{log.time}</td>
                    <td className="p-4 font-bold text-foreground font-mono">{log.provider}</td>
                    <td className="p-4 text-muted-foreground font-mono">{log.model}</td>
                    <td className="p-4">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {log.status} OK
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono">{log.duration}</td>
                    <td className="p-4 text-muted-foreground font-mono">{log.tokens}</td>
                    <td className="p-4">
                      {log.cached ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
                          Cached
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-muted text-muted-foreground border border-border uppercase">
                          Miss
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN AI PAGE CONTENT DISPATCHER
// ==========================================
function WorkersAiPageContent() {
  const { activeAccount } = useAccount();
  const searchParams = useSearchParams();
  
  // Tab hiện tại (hub | vectorize | gateway), mặc định là 'hub'
  const activeTab = searchParams.get("tab") || "hub";

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-8 w-full animate-in fade-in duration-200">
      {/* Header Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">
          {activeAccount}
        </Link>
        <span>/</span>
        <span className="text-foreground">AI</span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 select-none">
          <AiIcon size={24} className="text-cloudflare-orange" />
          {activeTab === "hub" && "Workers AI Hub"}
          {activeTab === "vectorize" && "Vectorize"}
          {activeTab === "gateway" && "AI Gateway"}
        </h1>
        <p className="text-xs text-muted-foreground">
          {activeTab === "hub" && "Deploy machine learning models instantly at the edge. Experience low latency inference powered by global GPUs."}
          {activeTab === "vectorize" && "Store and query vector embeddings for semantic search, recommendation engines, and LLM context retrieval."}
          {activeTab === "gateway" && "Cache responses, rate limit, and monitor usage across multiple AI providers including OpenAI, Hugging Face, and Workers AI."}
        </p>
      </div>

      {/* sub-tabs navigation */}
      <div className="flex border-b border-border select-none">
        <Link
          href="/dash/ai?tab=hub"
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "hub"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Workers AI Hub
        </Link>
        <Link
          href="/dash/ai?tab=vectorize"
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "vectorize"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Vectorize
        </Link>
        <Link
          href="/dash/ai?tab=gateway"
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === "gateway"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          AI Gateway
        </Link>
      </div>

      {/* Render sub-view dynamically based on tab */}
      {activeTab === "hub" && <WorkersAiHubView />}
      {activeTab === "vectorize" && <VectorizeView />}
      {activeTab === "gateway" && <AiGatewayView />}
    </div>
  );
}

export default function WorkersAiPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <WorkersAiPageContent />
    </Suspense>
  );
}
