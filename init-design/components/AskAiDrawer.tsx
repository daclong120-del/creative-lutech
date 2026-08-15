"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Loader2,
  ChevronDown,
  Plus,
  ExternalLink,
  Rocket,
  Cloud,
  RefreshCw,
  Contact,
  Database
} from "lucide-react";
import { useAccount } from "@/lib/account-context";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  {
    title: "Deploy a Worker",
    subtitle: "Help me get started",
    question: "How do I deploy a Worker?",
    icon: Rocket
  },
  {
    title: "Orange vs Gray Cloud",
    subtitle: "What is the difference?",
    question: "What is the difference between orange and gray cloud in Cloudflare?",
    icon: Cloud
  },
  {
    title: "Transfer a domain",
    subtitle: "Walk me through the process",
    question: "How do I transfer a domain to Cloudflare?",
    icon: RefreshCw
  },
  {
    title: "Find my account ID",
    subtitle: "Locate account and zone IDs",
    question: "Where can I find my account ID and zone ID?",
    icon: Contact
  },
  {
    title: "Bind R2 to a Worker",
    subtitle: "Connect object storage",
    question: "How do I bind R2 bucket to a Worker?",
    icon: Database
  }
];

const SIMULATED_ANSWERS: Record<string, string> = {
  "deploy a worker": "To deploy a Cloudflare Worker, you can use wrangler CLI:\n\n1. Initialize: `npx wrangler init my-worker`\n2. Develop: Edit `src/index.ts`\n3. Deploy: Run `npx wrangler deploy` to push your Worker live globally.",
  "orange vs gray cloud": "- **Orange Cloud (Proxied)**: Cloudflare handles DNS, provides security (WAF, DDoS mitigation), and performance optimizations (caching, SSL/TLS, content delivery).\n- **Gray Cloud (DNS Only)**: Cloudflare only resolves the DNS query. Traffic goes directly to your origin server, bypassing all Cloudflare CDN/Security features.",
  "transfer a domain": "To transfer a domain to Cloudflare Registrar:\n\n1. Unlock your domain at your current registrar.\n2. Obtain the Authorization (EPP) code.\n3. Add the domain to Cloudflare, ensure your DNS records are active.\n4. Go to **Domain Registration** -> **Transfer to Cloudflare**, enter the Authorization code, and pay the registry fee.",
  "find my account id": "To find your Account ID and Zone ID:\n\n1. Select your domain from the Home dashboard.\n2. On the **Overview** page, scroll down to the bottom right sidebar.\n3. You will see sections for **API** showing your **Zone ID** and **Account ID**.",
  "bind r2 to a worker": "To bind an R2 bucket to a Worker:\n\n1. Create an R2 bucket in your Cloudflare dashboard.\n2. In your Worker's `wrangler.toml` file, add:\n   ```toml\n   [[r2_buckets]]\n   binding = \"MY_BUCKET\"\n   bucket_name = \"your-bucket-name\"\n   ```\n3. In your Worker, access it via `env.MY_BUCKET.put()`, `env.MY_BUCKET.get()`, or `env.MY_BUCKET.delete()`."
};

let messageIdCounter = 0;
function createMessage(sender: "user" | "ai", text: string): Message {
  messageIdCounter += 1;
  return {
    id: `msg-${messageIdCounter}-${Date.now()}`,
    sender,
    text,
    timestamp: new Date()
  };
}

const SpheresArt = () => (
  <svg
    width="160"
    height="120"
    viewBox="0 0 160 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto select-none pointer-events-none"
  >
    <defs>
      <radialGradient id="sphere1" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffebdf" />
        <stop offset="35%" stopColor="#fba473" />
        <stop offset="100%" stopColor="#e0580c" />
      </radialGradient>
      <radialGradient id="sphere2" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffebd5" />
        <stop offset="45%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </radialGradient>
      <radialGradient id="sphere3" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fff7ed" />
        <stop offset="40%" stopColor="#fdba74" />
        <stop offset="100%" stopColor="#f97316" />
      </radialGradient>
      <filter id="sphereShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.1" />
      </filter>
    </defs>
    {/* Sphere 4 (back right) */}
    <circle cx="115" cy="50" r="18" fill="url(#sphere2)" filter="url(#sphereShadow)" opacity="0.8" />
    {/* Sphere 2 (back left) */}
    <circle cx="45" cy="65" r="14" fill="url(#sphere2)" filter="url(#sphereShadow)" opacity="0.8" />
    {/* Sphere 3 (middle left) */}
    <circle cx="62" cy="60" r="18" fill="url(#sphere3)" filter="url(#sphereShadow)" />
    {/* Sphere 1 (front center-right) */}
    <circle cx="90" cy="52" r="26" fill="url(#sphere1)" filter="url(#sphereShadow)" />
  </svg>
);

export default function AskAiDrawer() {
  const { isAskAiOpen, setIsAskAiOpen } = useAccount();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [greeting, setGreeting] = useState("Good afternoon.");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set greeting based on time of day
  useEffect(() => {
    const hr = new Date().getHours();
    let g = "Good afternoon.";
    if (hr < 12) {
      g = "Good morning.";
    } else if (hr < 18) {
      g = "Good afternoon.";
    } else {
      g = "Good evening.";
    }
    // Update asynchronously to prevent synchronous cascading renders warning
    setTimeout(() => {
      setGreeting(g);
    }, 0);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsAskAiOpen(false);
      }
    };
    if (isAskAiOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAskAiOpen, setIsAskAiOpen]);

  if (!isAskAiOpen) return null;

  const simulateAiResponse = (userText: string) => {
    setIsTyping(true);

    setTimeout(() => {
      const normalized = userText.toLowerCase();
      let responseText = "";

      if (normalized.includes("deploy") || normalized.includes("worker")) {
        responseText = SIMULATED_ANSWERS["deploy a worker"];
      } else if (normalized.includes("orange") || normalized.includes("gray") || normalized.includes("difference")) {
        responseText = SIMULATED_ANSWERS["orange vs gray cloud"];
      } else if (normalized.includes("transfer") || normalized.includes("domain")) {
        responseText = SIMULATED_ANSWERS["transfer a domain"];
      } else if (normalized.includes("account") || normalized.includes("id")) {
        responseText = SIMULATED_ANSWERS["find my account id"];
      } else if (normalized.includes("r2") || normalized.includes("bucket")) {
        responseText = SIMULATED_ANSWERS["bind r2 to a worker"];
      } else {
        responseText = `I received your question: "${userText}". As a Cloudflare Support Assistant, I suggest checking the official docs or your domain configuration page. Make sure proxy status is configured appropriately for your application flow!`;
      }

      setMessages(prev => [...prev, createMessage("ai", responseText)]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userMsg = createMessage("user", text);
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    simulateAiResponse(text);
  };

  return (
    <>
      {/* Backdrop (Mobile/Tablet only) */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-out animate-in fade-in lg:hidden"
        onClick={() => setIsAskAiOpen(false)}
      />

      {/* Drawer Panel */}
      <div
        className={cn(
          // Mobile/Tablet: fixed drawer on the right
          "fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[450px] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right font-sans",
          // Desktop: fixed drawer on the right with a specific width
          "lg:w-[400px] lg:max-w-none"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-card select-none">
          <button className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:bg-muted px-2.5 py-1.5 rounded-lg transition-colors focus:outline-none border border-transparent hover:border-border cursor-pointer">
            <span>New conversation</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <button
              onClick={() => setMessages([])}
              title="New conversation"
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors focus:outline-none cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              title="Open in new window"
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors focus:outline-none cursor-pointer"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button
              onClick={() => setIsAskAiOpen(false)}
              title="Close panel"
              className="p-1.5 hover:bg-muted hover:text-foreground rounded-lg transition-colors focus:outline-none cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Content / Empty State Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/10 bg-[radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:16px_16px]">
          {messages.length === 0 ? (
            <div className="flex flex-col min-h-full justify-between pb-2 space-y-6">
              {/* Need more help banner */}
              <div className="border border-border rounded-xl p-3.5 flex justify-between items-center bg-card shadow-xs select-none">
                <span className="text-xs font-semibold text-foreground">Need more help?</span>
                <button
                  onClick={() => window.open("https://support.cloudflare.com", "_blank")}
                  className="text-xs font-semibold text-foreground bg-card border border-border rounded-lg px-3.5 py-1.5 hover:bg-muted transition-colors shadow-xs focus:outline-none cursor-pointer"
                >
                  Support
                </button>
              </div>

              {/* Sphere cluster & Greeting */}
              <div className="text-center my-auto py-6 space-y-4">
                <SpheresArt />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">{greeting}</h1>
                  <p className="text-xs text-muted-foreground mt-1.5">What are we doing today?</p>
                </div>
              </div>

              {/* Vertical list of suggestions */}
              <div className="space-y-2 select-none">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.question)}
                    className="w-full flex items-center gap-3 border border-border bg-card rounded-xl p-3 text-left hover:border-cloudflare-orange hover:shadow-xs hover:-translate-y-0.5 transition-all duration-150 focus:outline-none cursor-pointer group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground group-hover:bg-cloudflare-orange/10 group-hover:text-cloudflare-orange transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{item.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-max max-w-[85%] flex-col gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-normal shadow-xs transition-all",
                    msg.sender === "user"
                      ? "ml-auto bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-card text-foreground rounded-tl-none border border-border"
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {msg.sender === "user" ? (
                      <>
                        <User className="h-3 w-3 text-primary-foreground/80" />
                        <span className="text-[9px] font-semibold opacity-80">You</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3 text-cloudflare-orange" />
                        <span className="text-[9px] font-semibold text-cloudflare-orange">AI Assistant</span>
                      </>
                    )}
                    <span className="text-[8px] opacity-60">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex w-max max-w-[85%] flex-col gap-1.5 rounded-2xl rounded-tl-none border border-border bg-card px-4 py-2.5 text-xs shadow-xs">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Bot className="h-3 w-3 text-cloudflare-orange" />
                    <span className="text-[9px] font-semibold text-cloudflare-orange">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-1 py-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground italic">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question about your setup..."
              className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder-muted-foreground focus:border-cloudflare-orange focus:outline-none focus:ring-1 focus:ring-cloudflare-orange transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-cloudflare-orange text-white hover:bg-cloudflare-orange/90 disabled:bg-muted disabled:text-muted-foreground transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
