"use client";

import { ResumeOptimizer } from "@/components/resume-optimizer";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <ResumeOptimizer />
      </main>
      <footer className="text-center text-sm text-muted-foreground p-4">
        <p>
          &copy; {new Date().getFullYear()} ResumeRevamp. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
