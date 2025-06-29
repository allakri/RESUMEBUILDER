
"use client";

import React from "react";
import type { ResumeDataWithIds } from "@/ai/resume-schema";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import type { EditableSection, RemovableSectionType, EditableSectionType } from "./resume-editor";

interface ResumePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  resumeData: ResumeDataWithIds;
  templateName?: string;
  isEditable?: boolean;
  onEdit?: (section: EditableSection) => void;
  onRemove?: (section: RemovableSectionType, id: string) => void;
}

const ActionButtons = ({ onEdit, onRemove }: { onEdit?: (() => void), onRemove?: (() => void) }) => (
  <div className="absolute top-1 right-1 flex items-center gap-1 p-1 rounded-md bg-secondary/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 print:hidden">
    {onEdit && (
      <Button variant="ghost" size="icon" className="h-6 w-6 text-secondary-foreground hover:bg-primary/20" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Edit section</span>
      </Button>
    )}
    {onRemove && (
      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/20" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove item</span>
      </Button>
    )}
  </div>
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
          "bg-white text-black w-full prose-sm template-base",
          `template-${templateName}`,
          className
        )}
        {...props}
      >
        <div className="preview-content-wrapper">
            <header className="header relative group">
                <h1 className="name">{resume.name}</h1>
                <p className="contact-info">
                    {[resume.email, resume.phone].filter(Boolean).join(" | ")}
                </p>
                {isEditable && <ActionButtons onEdit={() => handleEdit('contact')} />}
            </header>

            <main>
                <div className={cn(templateName === 'modern' || templateName === 'creative' ? 'grid grid-cols-12 gap-x-8' : '')}>
                    <div className={cn(templateName === 'modern' || templateName === 'creative' ? 'main-content col-span-12 md:col-span-8' : '')}>
                        
                        {resume.websites && resume.websites.length > 0 && (
                            <section className="relative group/section mb-4 -mt-2">
                                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
                                    {resume.websites.map((site) => (
                                        <div key={site.id} className="relative group/item flex items-center gap-1">
                                            <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" onClick={(e) => isEditable && e.preventDefault()}>{site.name}</a>
                                            {isEditable && (
                                                <div className="flex opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleEdit('websites', site.id)}><Pencil className="h-3 w-3" /><span className="sr-only">Edit Website</span></Button>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleRemove('websites', site.id)}><Trash2 className="h-3 w-3" /><span className="sr-only">Remove Website</span></Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isEditable && <Button variant="link" size="sm" className="h-5" onClick={() => handleEdit('new_website')}>+ Add Link</Button>}
                                </div>
                            </section>
                        )}

                        {resume.summary && (
                            <section className="relative group">
                                <h2 className="section-title">Summary</h2>
                                <p className="text-sm">{resume.summary}</p>
                                {isEditable && <ActionButtons onEdit={() => handleEdit('summary')} />}
                            </section>
                        )}

                        {resume.experience && resume.experience.length > 0 && (
                            <section>
                                <h2 className="section-title">Experience</h2>
                                {resume.experience.map((exp) => (
                                    <div key={exp.id} className="entry relative group">
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="title">{exp.title}</h3>
                                            <p className="dates">{exp.dates}</p>
                                        </div>
                                        <div className="flex items-baseline justify-between">
                                            <p className="company">{exp.company}</p>
                                            <p className="location">{exp.location}</p>
                                        </div>
                                        <ul className="responsibilities">
                                            {exp.responsibilities.map((resp, i) => <li key={i}>{resp}</li>)}
                                        </ul>
                                        {isEditable && <ActionButtons onEdit={() => handleEdit('experience', exp.id)} onRemove={() => handleRemove('experience', exp.id)} />}
                                    </div>
                                ))}
                            </section>
                        )}
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
                                {isEditable && <ActionButtons onEdit={() => handleEdit('projects', proj.id)} onRemove={() => handleRemove('projects', proj.id)} />}
                                </div>
                            ))}
                             {isEditable && <Button variant="link" size="sm" className="w-full mt-2" onClick={() => handleEdit('new_project')}>+ Add Project</Button>}
                            </section>
                        )}
                    </div>

                    <div className={cn(templateName === 'modern' || templateName === 'creative' ? 'sidebar col-span-12 md:col-span-4' : '')}>
                        {resume.education && resume.education.length > 0 && (
                            <section>
                                <h2 className="section-title">Education</h2>
                                {resume.education.map((edu) => (
                                    <div key={edu.id} className="entry relative group">
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="degree">{edu.degree}</h3>
                                            <p className="dates">{edu.dates}</p>
                                        </div>
                                        <p><span className="school">{edu.school}</span>, <span className="location">{edu.location}</span></p>
                                        {isEditable && <ActionButtons onEdit={() => handleEdit('education', edu.id)} onRemove={() => handleRemove('education', edu.id)} />}
                                    </div>
                                ))}
                            </section>
                        )}

                        {resume.skills && resume.skills.length > 0 && (
                            <section className="relative group skills">
                                <h2 className="section-title">Skills</h2>
                                <p className="text-sm">{resume.skills.join(" | ")}</p>
                                {isEditable && <ActionButtons onEdit={() => handleEdit('skills')} />}
                            </section>
                        )}
                        
                        {resume.achievements && resume.achievements.length > 0 && (
                            <section className="relative group">
                            <h2 className="section-title">Achievements</h2>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                                {resume.achievements.map((ach, i) => <li key={i}>{ach}</li>)}
                            </ul>
                            {isEditable && <ActionButtons onEdit={() => handleEdit('achievements')} />}
                            </section>
                        )}

                        {resume.customSections && resume.customSections.length > 0 && (
                             <section>
                                <h2 className="section-title">More Info</h2>
                                {resume.customSections.map(sec => (
                                    <div key={sec.id} className="relative group entry">
                                        <h3 className="font-bold">{sec.title}</h3>
                                        <p className="text-sm whitespace-pre-wrap">{sec.content}</p>
                                        {isEditable && <ActionButtons onEdit={() => handleEdit('customSections', sec.id)} onRemove={() => handleRemove('customSections', sec.id)} />}
                                    </div>
                                ))}
                            </section>
                        )}
                        
                        {resume.hobbies && resume.hobbies.length > 0 && (
                            <section className="relative group">
                            <h2 className="section-title">Hobbies & Interests</h2>
                            <p className="text-sm">{resume.hobbies.join(" | ")}</p>
                            {isEditable && <ActionButtons onEdit={() => handleEdit('hobbies')} />}
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
      </div>
    );
  }
);
ResumePreview.displayName = "ResumePreview";
