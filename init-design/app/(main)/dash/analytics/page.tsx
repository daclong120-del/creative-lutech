"use client";

import Link from "next/link";

import { useAccount } from "@/lib/account-context";

import React, { useState, useEffect, useRef } from "react";

interface DataPoint {
  hour: string;
  visitors: number;
  requests: number;
}

export default function AnalyticsPage() {
  const { activeAccount } = useAccount();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    if (!chartRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setChartWidth(entry.contentRect.width || 800);
        }
      }
    });
    resizeObserver.observe(chartRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 24 hour analytics mockup data
  const data: DataPoint[] = [
    { hour: "00:00", visitors: 120, requests: 450 },
    { hour: "01:00", visitors: 90, requests: 310 },
    { hour: "02:00", visitors: 60, requests: 210 },
    { hour: "03:00", visitors: 50, requests: 180 },
    { hour: "04:00", visitors: 70, requests: 230 },
    { hour: "05:00", visitors: 110, requests: 490 },
    { hour: "06:00", visitors: 210, requests: 850 },
    { hour: "07:00", visitors: 380, requests: 1200 },
    { hour: "08:00", visitors: 560, requests: 2100 },
    { hour: "09:00", visitors: 720, requests: 2800 },
    { hour: "10:00", visitors: 850, requests: 3400 },
    { hour: "11:00", visitors: 920, requests: 3900 },
    { hour: "12:00", visitors: 890, requests: 3600 },
    { hour: "13:00", visitors: 810, requests: 3200 },
    { hour: "14:00", visitors: 780, requests: 3100 },
    { hour: "15:00", visitors: 840, requests: 3300 },
    { hour: "16:00", visitors: 890, requests: 3500 },
    { hour: "17:00", visitors: 790, requests: 3000 },
    { hour: "18:00", visitors: 680, requests: 2400 },
    { hour: "19:00", visitors: 590, requests: 2100 },
    { hour: "20:00", visitors: 480, requests: 1800 },
    { hour: "21:00", visitors: 350, requests: 1300 },
    { hour: "22:00", visitors: 240, requests: 900 },
    { hour: "23:00", visitors: 160, requests: 600 }
  ];

  // SVG Chart Dimensions
  const svgWidth = chartWidth;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  // Max bounds
  const maxVisitors = 1000;
  const maxRequests = 4000;

  // Coordinate conversion helper functions
  const getX = (index: number) => {
    const scaleWidth = svgWidth - paddingX * 2;
    return paddingX + (index / (data.length - 1)) * scaleWidth;
  };

  const getYVisitors = (val: number) => {
    const scaleHeight = svgHeight - paddingY * 2;
    return svgHeight - paddingY - (val / maxVisitors) * scaleHeight;
  };

  const getYRequests = (val: number) => {
    const scaleHeight = svgHeight - paddingY * 2;
    return svgHeight - paddingY - (val / maxRequests) * scaleHeight;
  };

  // Build SVG Path strings
  const visitorsPoints = data.map((d, i) => `${getX(i)},${getYVisitors(d.visitors)}`).join(" ");
  const requestsPoints = data.map((d, i) => `${getX(i)},${getYRequests(d.requests)}`).join(" ");

  const visitorsPath = `M ${visitorsPoints}`;
  const requestsPath = `M ${requestsPoints}`;

  // Area under path
  const visitorsAreaPath = `${visitorsPath} L ${getX(data.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;
  const requestsAreaPath = `${requestsPath} L ${getX(data.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;

  // Handles mouse movement to update tooltip position & hover index
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Since viewBox width matches clientWidth exactly, mouseX is directly in SVG coordinates
    const scaleWidth = Math.max(1, svgWidth - paddingX * 2);
    const scaleLeft = paddingX;
    const relativeX = mouseX - scaleLeft;

    let index = Math.round((relativeX / scaleWidth) * (data.length - 1));
    index = Math.max(0, Math.min(data.length - 1, index));

    setHoveredIndex(index);
    setTooltipPos({ x: mouseX, y: mouseY });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setTooltipPos(null);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6 w-full animate-in fade-in duration-200">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium select-none">
        <Link href="/dash/home" className="hover:text-foreground cursor-pointer transition-colors">{activeAccount}</Link>
        <span>/</span>
        <span className="text-foreground">Web Analytics</span>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">
          Web Traffic & Analytics
        </h1>
        <p className="text-xs text-muted-foreground">
          Analyze visitor traffic patterns, total resource requests, bounce rate, and average latency.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Visitors</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">14,248</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">+12.3%</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Requests</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">58,290</span>
            <span className="text-[10px] text-rose-500 font-bold font-mono">-2.1%</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bounce Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">28.4%</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">-1.8%</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-1.5 shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Page Load</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-foreground font-mono">1.24s</span>
            <span className="text-[10px] text-emerald-500 font-bold font-mono">-0.12s</span>
          </div>
        </div>
      </div>

      {/* Main Chart Container */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm relative">
        <div className="flex items-center justify-between select-none">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-foreground">Traffic Over Time (24h)</h2>
            <p className="text-xs text-muted-foreground">Comparative flow of Unique Visitors vs API Requests</p>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-semibold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded bg-blue-500" />
              <span>Unique Visitors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded bg-amber-500" />
              <span>Requests</span>
            </div>
          </div>
        </div>

        {/* SVG Interactive Chart Box */}
        <div className="relative w-full h-[240px]">
          <svg
            ref={chartRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full cursor-crosshair overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="requestsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} className="stroke-border" strokeWidth={0.5} />
            <line x1={paddingX} y1={svgHeight / 2} x2={svgWidth - paddingX} y2={svgHeight / 2} className="stroke-border" strokeWidth={0.5} />
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} className="stroke-border" strokeWidth={0.5} />

            {/* Area Fills */}
            <path d={visitorsAreaPath} fill="url(#visitorsGrad)" />
            <path d={requestsAreaPath} fill="url(#requestsGrad)" />

            {/* Data Lines */}
            <path d={visitorsPath} fill="none" className="stroke-blue-500" strokeWidth={2} strokeLinecap="round" />
            <path d={requestsPath} fill="none" className="stroke-amber-500" strokeWidth={2} strokeLinecap="round" />

            {/* Bottom Labels (Hours) */}
            <g className="text-[10px] fill-muted-foreground select-none font-medium">
              <text x={getX(0)} y={svgHeight - 10} textAnchor="start">00:00</text>
              <text x={getX(6)} y={svgHeight - 10} textAnchor="middle">06:00</text>
              <text x={getX(12)} y={svgHeight - 10} textAnchor="middle">12:00</text>
              <text x={getX(18)} y={svgHeight - 10} textAnchor="middle">18:00</text>
              <text x={getX(23)} y={svgHeight - 10} textAnchor="end">23:00</text>
            </g>

            {/* Hover Guides */}
            {hoveredIndex !== null && (
              <>
                {/* Vertical Cursor Tracker Line */}
                <line
                  x1={getX(hoveredIndex)}
                  y1={paddingY}
                  x2={getX(hoveredIndex)}
                  y2={svgHeight - paddingY}
                  className="stroke-muted-foreground/30"
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />

                {/* Highlight Circle for Visitors */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYVisitors(data[hoveredIndex].visitors)}
                  r={5}
                  className="fill-blue-500 stroke-card"
                  strokeWidth={1.5}
                />

                {/* Highlight Circle for Requests */}
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getYRequests(data[hoveredIndex].requests)}
                  r={5}
                  className="fill-amber-500 stroke-card"
                  strokeWidth={1.5}
                />
              </>
            )}
          </svg>

          {/* HTML Float Tooltip */}
          {hoveredIndex !== null && tooltipPos && (
            <div
              className="absolute z-10 bg-card border border-border rounded-lg shadow-lg p-3 text-[10px] space-y-1.5 select-none pointer-events-none transition-all duration-75"
              style={{
                left: `${tooltipPos.x + 15}px`,
                top: `${tooltipPos.y - 45}px`,
              }}
            >
              <div className="font-bold text-foreground">{data[hoveredIndex].hour}</div>
              <div className="space-y-0.5 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Visitors:</span>
                  <span className="text-foreground font-bold font-mono">{data[hoveredIndex].visitors}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-muted-foreground">Requests:</span>
                  <span className="text-foreground font-bold font-mono">{data[hoveredIndex].requests}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
