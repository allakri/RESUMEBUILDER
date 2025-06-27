"use client";

import React from "react";
import type { ResumeDataWithIds } from "@/ai/flows/create-resume";
import { cn } from "@/lib/utils";
import { Globe, Book, Trophy, Heart } from "lucide-react";

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
          "p-8 bg-white text-black font-sans w-full",
          `template-${templateName}`,
          className
        )}
        {...props}
      >
        <header className="text-center mb-6 header">
          <h1 className="name">
            {resume.name}
          </h1>
          <p className="text-sm mt-2 contact-info">
            {resume.email} | {resume.phone}
          </p>
        </header>
        <main>
          {resume.websites && resume.websites.length > 0 && (
            <section className="mb-6 text-center">
                <p className="text-sm flex justify-center items-center gap-4">
                    {resume.websites.map((site) => (
                        <a key={site.id} href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{site.name}</a>
                    ))}
                </p>
            </section>
          )}

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
          
          {resume.projects && resume.projects.length > 0 && (
            <section className="mb-6">
              <h2 className="section-title">Projects</h2>
              {resume.projects.map((proj) => (
                <div key={proj.id} className="mb-4 entry">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold">{proj.name}</h3>
                    {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-sm font-light hover:underline">Link</a>}
                  </div>
                  <p className="text-sm italic">{proj.technologies.join(", ")}</p>
                  <p className="text-sm mt-1">{proj.description}</p>
                </div>
              ))}
            </section>
          )}

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

          {resume.achievements && resume.achievements.length > 0 && (
            <section className="mt-6">
              <h2 className="section-title">Achievements</h2>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {resume.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
              </ul>
            </section>
          )}

           {resume.hobbies && resume.hobbies.length > 0 && (
            <section className="mt-6">
              <h2 className="section-title">Hobbies & Interests</h2>
              <p className="text-sm">{resume.hobbies.join(" | ")}</p>
            </section>
          )}
        </main>
      </div>
    );
  }
);
ResumePreview.displayName = "ResumePreview";
