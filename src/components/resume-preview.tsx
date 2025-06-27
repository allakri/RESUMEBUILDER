
"use client";

import * as React from "react";
import type { ResumeDataWithIds } from "@/ai/flows/create-resume";
import { cn } from "@/lib/utils";

interface ResumePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  resumeData: ResumeDataWithIds;
  templateName?: string;
}

export const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resumeData: resume, templateName = 'modern', className, ...props }, ref) => {
    if (!resume) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "p-8 bg-white text-black font-sans w-[8.5in]",
          templateName,
          className
        )}
        {...props}
      >
        <header className="text-center mb-6 header">
          <h1 className="text-4xl font-bold tracking-wider uppercase name">
            {resume.name}
          </h1>
          <p className="text-sm mt-2 contact-info">
            {resume.email} | {resume.phone}
            {resume.linkedin && ` | ${resume.linkedin}`}
          </p>
        </header>
        <main>
          <section className="mb-6">
            <h2 className="section-title">
              Summary
            </h2>
            <p className="text-sm">{resume.summary}</p>
          </section>

          <section className="mb-6">
            <h2 className="section-title">
              Experience
            </h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-4 entry">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold">{exp.title}</h3>
                  <p className="text-sm font-light">{exp.dates}</p>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold">{exp.company}</p>
                  <p className="text-sm font-light">{exp.location}</p>
                </div>
                <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                  {exp.responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="mb-6">
            <h2 className="section-title">
              Education
            </h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="mb-2 entry">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold">{edu.degree}</h3>
                  <p className="text-sm font-light">{edu.dates}</p>
                </div>
                <p>{edu.school}, {edu.location}</p>
              </div>
            ))}
          </section>

          <section>
            <h2 className="section-title">
              Skills
            </h2>
            <p className="text-sm">{resume.skills.join(" | ")}</p>
          </section>
        </main>
      </div>
    );
  }
);
ResumePreview.displayName = "ResumePreview";
