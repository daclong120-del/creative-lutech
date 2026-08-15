import React from 'react';

export default function ReleaseOpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/10">
      {children}
    </div>
  );
}
