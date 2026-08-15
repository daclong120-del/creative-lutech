"use client";

import React from "react";
import Link from "next/link";
import {
  InboxIcon,
  SubmitCaseIcon,
  AskAiCardIcon,
  ReportAbuseIcon,
  AskCommunityIcon,
  ChevronRightIcon
} from "./icons";
import { cn } from "@/lib/utils";
import { useAccount } from "@/lib/account-context";

interface SupportCard {
  title: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }>;
  colSpan: string;
  badge?: string;
  href: string;
}

export default function SupportGrid() {
  const cards: SupportCard[] = [
    {
      title: "My cases",
      description: "Review support tickets you have opened with Cloudflare Support, track their progress, and upload updates.",
      icon: InboxIcon,
      colSpan: "lg:col-span-3 md:col-span-1",
      href: "/support/cases"
    },
    {
      title: "Submit a case",
      description: "Open a new support request. Account, billing, and technical queries can be raised by authorized users.",
      icon: SubmitCaseIcon,
      colSpan: "lg:col-span-3 md:col-span-1",
      href: "/support/submit"
    },
    {
      title: "Ask AI Assistant",
      description: "Get immediate answers to your technical questions using our context-aware Cloudflare AI Support Assistant.",
      icon: AskAiCardIcon,
      colSpan: "lg:col-span-2 md:col-span-1",
      badge: "Fastest",
      href: "#"
    },
    {
      title: "Report abuse",
      description: "File a trust & safety report for sites hosted on Cloudflare displaying malware, phishing, or copyright violations.",
      icon: ReportAbuseIcon,
      colSpan: "lg:col-span-2 md:col-span-1",
      href: "#"
    },
    {
      title: "Ask community",
      description: "Ask questions, find answers, and share tips with fellow operators and engineers in the Cloudflare Community forum.",
      icon: AskCommunityIcon,
      colSpan: "lg:col-span-2 md:col-span-2",
      href: "#"
    }
  ];

  const { setIsAskAiOpen } = useAccount();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 select-none">
      {cards.map((card, index) => {
        const CardIcon = card.icon;
        return (
          <Link
            key={index}
            href={card.href}
            onClick={(e) => {
              if (card.title === "Ask AI Assistant") {
                e.preventDefault();
                setIsAskAiOpen(true);
              }
            }}
            className={cn(
              "group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 shadow-sm cursor-pointer",
              "hover:border-primary hover:shadow-md",
              card.colSpan
            )}
          >
            {/* Upper half: Icon and Title */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors duration-200">
                  <CardIcon size={20} />
                </div>
                {card.badge && (
                  <span className="inline-flex items-center rounded-md bg-cloudflare-orange/10 px-2 py-0.5 text-[10px] font-semibold text-cloudflare-orange">
                    {card.badge}
                  </span>
                )}
              </div>

              <h3 className="mt-4 text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors duration-150">
                {card.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-normal">
                {card.description}
              </p>
            </div>

            {/* Bottom half: Action Trigger */}
            <div className="mt-5 flex items-center justify-end text-muted-foreground group-hover:text-primary transition-colors duration-150">
              <ChevronRightIcon
                size={14}
                className="transform transition-transform duration-200 group-hover:translate-x-1"
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

