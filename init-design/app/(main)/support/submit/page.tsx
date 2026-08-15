"use client";

import { useAccount } from "@/lib/account-context";

import React, { useState } from "react";
import Link from "next/link";
import DropdownSelect from "@/components/DropdownSelect";
import { useRouter } from "next/navigation";

interface AttachedFile {
  name: string;
  size: string;
  progress: number; // 0 to 100
  status: "uploading" | "completed" | "error";
}

export default function SubmitCase() {
  const { activeAccount } = useAccount();
  const router = useRouter();

  // Form Fields State
  const [category, setCategory] = useState("Technical");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  
  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [newCaseId, setNewCaseId] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Handle file select and simulate upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach((file) => {
        simulateUpload(file);
      });
    }
  };

  const simulateUpload = (file: File) => {
    const formattedSize = (file.size / 1024 / 1024).toFixed(2) + " MB";
    const newFile: AttachedFile = {
      name: file.name,
      size: formattedSize,
      progress: 0,
      status: "uploading",
    };

    setAttachments((prev) => [...prev, newFile]);

    // Simulate progress counting up to 100%
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 10;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setAttachments((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, progress: 100, status: "completed" as const }
              : f
          )
        );
      } else {
        setAttachments((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, progress: currentProgress } : f
          )
        );
      }
    }, 150);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files);
      filesArray.forEach((file) => {
        simulateUpload(file);
      });
    }
  };

  const removeAttachment = (fileName: string) => {
    setAttachments((prev) => prev.filter((f) => f.name !== fileName));
  };

  // Submit the Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    // Start loading
    setIsSubmitting(true);

    setTimeout(() => {
      const generatedId = "#8" + Math.floor(Math.random() * 90000 + 10000);
      setNewCaseId(generatedId);

      const newCase = {
        id: generatedId,
        subject: subject.trim(),
        category,
        status: "Open" as const,
        lastUpdated: "Just now",
        description: description.trim(),
        createdAt: new Date().toISOString(),
        replies: [
          {
            id: "r_init",
            sender: "user" as const,
            text: description.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
        attachments: attachments
          .filter((f) => f.status === "completed")
          .map((f) => f.name),
      };

      // Retrieve and save back to local storage
      const stored = localStorage.getItem("cloudflare_cases");
      let currentCases = [];
      if (stored) {
        try {
          currentCases = JSON.parse(stored);
        } catch {
          currentCases = [];
        }
      }
      const updatedCases = [newCase, ...currentCases];
      localStorage.setItem("cloudflare_cases", JSON.stringify(updatedCases));

      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Auto redirect to My Cases after 2 seconds
      setTimeout(() => {
        router.push("/support/cases");
      }, 2000);
    }, 1200);
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 py-8 space-y-6 text-left select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Link href="/" className="hover:text-foreground transition-colors">
          {activeAccount}
        </Link>
        <span>/</span>
        <Link href="/" className="hover:text-foreground transition-colors">
          Support
        </Link>
        <span>/</span>
        <span className="text-foreground">Submit a case</span>
      </div>

      {!submitSuccess ? (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Submit a support case
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              Please fill out the form below. Standard account, billing, or technical cases can be created.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            {/* Category dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-semibold text-foreground">
                Category
              </label>
              <DropdownSelect
                id="category"
                value={category}
                onChange={(val) => setCategory(val)}
                options={[
                  { value: "Technical", label: "Technical Support (DNS, CDN, WAF, Workers)" },
                  { value: "Billing", label: "Billing & Account Subscriptions" },
                  { value: "Trust & Safety", label: "Trust & Safety (Abuse, Malicious sites)" },
                  { value: "Feature Request", label: "Feature Request / Feedback" },
                ]}
                buttonClassName="py-2 border-border bg-background"
                fullWidth
              />
            </div>

            {/* Subject Input */}
            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-xs font-semibold text-foreground">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. DNS query timeouts on secondary nameservers"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                required
                minLength={5}
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-semibold text-foreground">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail. Include any reproduction steps, domain names, wrangler configs, curl logs, or specific error messages."
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-y"
                required
                minLength={10}
              />
            </div>

            {/* File Upload Dropzone */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Attachments (Optional)</span>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center border border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-150 ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="size-7 text-muted-foreground group-hover:text-primary mb-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                  />
                </svg>

                <p className="text-xs font-semibold text-foreground">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Upload configuration files, error logs, or screenshots (Max 5MB per file)
                </p>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border border-border rounded-lg p-2.5 bg-muted/30 text-xs gap-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground truncate select-text">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0 select-text">
                            {file.size}
                          </span>
                        </div>

                        {file.status === "uploading" ? (
                          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-150"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="size-3.5"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>Ready to attach</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAttachment(file.name)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="size-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/support/cases"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-xs font-semibold hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/95 transition-colors focus-visible:outline-none disabled:opacity-50 min-w-[100px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting...</span>
                  </div>
                ) : (
                  <span>Submit Case</span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Success State Screen */
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card border border-border rounded-xl shadow-sm space-y-4 animate-in zoom-in duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="size-6 animate-pulse"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">Support Case Submitted!</h2>
            <p className="text-xs text-muted-foreground">
              Your case has been created with ID <span className="font-bold text-foreground select-text">{newCaseId}</span>.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
            <svg className="animate-spin h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Redirecting to cases list...</span>
          </div>
        </div>
      )}
    </div>
  );
}
