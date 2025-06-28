"use client";

import React from "react";
import type { ResumeDataWithIds } from "@/ai/flows/create-resume";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

type EditableSectionType = 'contact' | 'summary' | 'experience' | 'education' | 'websites' | 'projects' | 'skills' | 'achievements' | 'hobbies' | 'customSections';
type RemovableSectionType = 'experience' | 'education' | 'websites' | 'projects' | 'customSections';

interface ResumePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  resumeData: ResumeDataWithIds;
  templateName?: string;
  isEditable?: boolean;
  onEdit?: (section: { type: EditableSectionType, id?: string }) => void;
  onRemove?: (section: RemovableSectionType, id: string) => void;
}

const EditButton = ({ onEdit }: { onEdit: () => void }) => (
  <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onEdit}>
    <Pencil className="h-4 w-4" />
  </Button>
);

const RemoveButton = ({ onRemove }: { onRemove: () => void }) => (
    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={onRemove}>
      <Trash2 className="h-4 w-4" />
    </Button>
);


export const ResumePreview = React.forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resumeData: resume, templateName = 'modern', className, isEditable = false, onEdit = () => {}, onRemove = () => {}, ...props }, ref) => {
    if (!resume) return null;
    
    const handleEdit = (type: EditableSectionType, id?: string) => {
        if (isEditable) onEdit({ type, id });
    }
    
    const handleRemove = (type: RemovableSectionType, id: string) => {
        if (isEditable) onRemove(type, id);
    }

    return (
      <div
        ref={ref}
        className={cn(
          "p-8 bg-white text-black w-full prose-sm template-base",
          `template-${templateName}`,
          className
        )}
        {...props}
      >
        <header className="header relative group">
          <h1 className="name">
            {resume.name}
          </h1>
          <p className="contact-info">
            {resume.email} | {resume.phone}
          </p>
          {isEditable && <EditButton onEdit={() => handleEdit('contact')} />}
        </header>
        <main>
          {resume.websites && resume.websites.length > 0 && (
            <section className="text-center relative group">
                <div className="flex justify-center items-center gap-4 flex-wrap">
                    {resume.websites.map((site) => (
                        <div key={site.id} className="relative group/item flex items-center gap-1">
                            <a href={site.url} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={(e) => isEditable && e.preventDefault()}>{site.name}</a>
                             {isEditable && (
                                <div className="flex">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 opacity-0 group-hover/item:opacity-100" onClick={() => handleEdit('websites', site.id)}><Pencil className="h-3 w-3"/></Button>
                                    <RemoveButton onRemove={() => handleRemove('websites', site.id)} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
          )}

          <section className="relative group">
            <h2 className="section-title">Summary</h2>
            <p className="text-sm">{resume.summary}</p>
            {isEditable && <EditButton onEdit={() => handleEdit('summary')} />}
          </section>

          <section>
            <h2 className="section-title">Experience</h2>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="entry relative group">
                <div className="flex justify-between items-baseline">
                  <h3 className="title">{exp.title}</h3>
                  <p className="dates">{exp.dates}</p>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="company">{exp.company}</p>
                  <p className="location">{exp.location}</p>
                </div>
                <ul className="responsibilities">
                  {exp.responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
                {isEditable && <div className="absolute top-0 right-0 flex"><EditButton onEdit={() => handleEdit('experience', exp.id)} /><RemoveButton onRemove={() => handleRemove('experience', exp.id)} /></div>}
              </div>
            ))}
          </section>
          
          {resume.projects && resume.projects.length > 0 && (
            <section>
              <h2 className="section-title">Projects</h2>
              {resume.projects.map((proj) => (
                <div key={proj.id} className="entry relative group">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold">{proj.name}</h3>
                    {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-sm font-light hover:underline" onClick={(e) => isEditable && e.preventDefault()}>Link</a>}
                  </div>
                  <p className="text-sm italic">{proj.technologies.join(", ")}</p>
                  <p className="text-sm mt-1">{proj.description}</p>
                  {isEditable && <div className="absolute top-0 right-0 flex"><EditButton onEdit={() => handleEdit('projects', proj.id)} /><RemoveButton onRemove={() => handleRemove('projects', proj.id)} /></div>}
                </div>
              ))}
            </section>
          )}

          <section>
            <h2 className="section-title">Education</h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="entry relative group">
                <div className="flex justify-between items-baseline">
                  <h3 className="degree">{edu.degree}</h3>
                  <p className="dates">{edu.dates}</p>
                </div>
                <p><span className="school">{edu.school}</span>, <span className="location">{edu.location}</span></p>
                {isEditable && <div className="absolute top-0 right-0 flex"><EditButton onEdit={() => handleEdit('education', edu.id)} /><RemoveButton onRemove={() => handleRemove('education', edu.id)} /></div>}
              </div>
            ))}
          </section>

          {resume.customSections && resume.customSections.length > 0 && (
            <>
              {resume.customSections.map(sec => (
                <section key={sec.id} className="relative group">
                  <h2 className="section-title">{sec.title}</h2>
                  <p className="text-sm whitespace-pre-wrap">{sec.content}</p>
                  {isEditable && <div className="absolute top-0 right-0 flex"><EditButton onEdit={() => handleEdit('customSections', sec.id)} /><RemoveButton onRemove={() => handleRemove('customSections', sec.id)} /></div>}
                </section>
              ))}
            </>
          )}

          <section className="relative group skills">
            <h2 className="section-title">Skills</h2>
            <p className="text-sm">{resume.skills.join(" | ")}</p>
             {isEditable && <EditButton onEdit={() => handleEdit('skills')} />}
          </section>

          {resume.achievements && resume.achievements.length > 0 && (
            <section className="relative group">
              <h2 className="section-title">Achievements</h2>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {resume.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
              </ul>
              {isEditable && <EditButton onEdit={() => handleEdit('achievements')} />}
            </section>
          )}

           {resume.hobbies && resume.hobbies.length > 0 && (
            <section className="relative group">
              <h2 className="section-title">Hobbies & Interests</h2>
              <p className="text-sm">{resume.hobbies.join(" | ")}</p>
              {isEditable && <EditButton onEdit={() => handleEdit('hobbies')} />}
            </section>
          )}
        </main>
      </div>
    );
  }
);
ResumePreview.displayName = "ResumePreview";
