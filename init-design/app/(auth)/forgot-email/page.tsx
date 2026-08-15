import React, { Suspense } from "react";
import ForgotEmailForm from "./forgot-email-form";

export default function ForgotEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse select-none">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
            <div className="h-10 bg-muted rounded w-full"></div>
          </div>
        </div>
      }
    >
      <ForgotEmailForm />
    </Suspense>
  );
}
