
"use client";

import React, { useRef, useState } from "react";
import {
  ChevronLeft,
  Download,
  Loader2,
  PlusCircle,
  Redo,
  Sparkles,
  Trash2,
  Undo,
  Pencil,
} from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import jsPDF from "jspdf";
import type { ResumeData, ResumeDataWithIds, ExperienceWithId, EducationWithId, WebsiteWithId, ProjectWithId, CustomSectionWithId } from "@/ai/flows/create-resume";
import { enhanceResume } from "@/ai/flows/enhance-resume";
import { useHistoryState } from "@/hooks/use-history-state";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ResumePreview } from "./resume-preview";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

interface ResumeEditorProps {
  initialResumeData: ResumeDataWithIds;
  onBack: () => void;
}

// Helper for deep cloning without IDs for the API
const stripIds = (resume: ResumeDataWithIds): ResumeData => {
    const { experience, education, projects, websites, customSections, ...rest } = resume;
    return {
        ...rest,
        experience: experience.map(({ id, ...exp }) => exp),
        education: education.map(({ id, ...edu }) => edu),
        projects: (projects || []).map(({ id, ...proj }) => proj),
        websites: (websites || []).map(({ id, ...site }) => site),
        customSections: (customSections || []).map(({ id, ...sec }) => sec),
    };
};

type EditableSection =
  | { type: 'contact' }
  | { type: 'summary' }
  | { type: 'experience'; id: string }
  | { type: 'education'; id: string }
  | { type: 'websites'; id: string }
  | { type: 'projects'; id: string }
  | { type: 'skills' }
  | { type: 'achievements' }
  | { type: 'hobbies' }
  | { type: 'customSections'; id: string }
  | { type: 'new_experience' }
  | { type: 'new_education' }
  | { type: 'new_website' }
  | { type: 'new_project' }
  | { type: 'new_customSection' };


export function ResumeEditor({ initialResumeData, onBack }: ResumeEditorProps) {
  const {
    state: resume,
    set: setResume,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<ResumeDataWithIds>(initialResumeData);

  const [template, setTemplate] = useState("modern");
  const previewRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);


  const handleUpdate = (updater: (draft: ResumeDataWithIds) => void) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    updater(newResume);
    setResume(newResume);
  };

  const handleEdit = (section: EditableSection) => {
    let dataToEdit: any;

    switch (section.type) {
      case 'contact':
        dataToEdit = { name: resume.name, email: resume.email, phone: resume.phone };
        break;
      case 'summary':
        dataToEdit = { summary: resume.summary };
        break;
      case 'experience':
        dataToEdit = resume.experience?.find(item => item.id === section.id);
        break;
      case 'education':
        dataToEdit = resume.education?.find(item => item.id === section.id);
        break;
      case 'websites':
        dataToEdit = resume.websites?.find(item => item.id === section.id);
        break;
      case 'projects':
        dataToEdit = resume.projects?.find(item => item.id === section.id);
        break;
      case 'customSections':
        dataToEdit = resume.customSections?.find(item => item.id === section.id);
        break;
      case 'new_experience':
        dataToEdit = { title: "", company: "", location: "", dates: "", responsibilities: [""] };
        break;
      case 'new_education':
        dataToEdit = { degree: "", school: "", location: "", dates: "" };
        break;
      case 'new_website':
        dataToEdit = { name: "", url: "" };
        break;
      case 'new_project':
        dataToEdit = { name: "", description: "", technologies: [], url: "" };
        break;
      case 'new_customSection':
        dataToEdit = { title: "New Section", content: "Details about this section." };
        break;
      case 'skills':
      case 'hobbies':
      case 'achievements':
        dataToEdit = resume[section.type] ?? [];
        break;
      default:
        console.error("Unhandled section type in handleEdit:", section);
        return;
    }

    if (typeof dataToEdit === 'undefined') {
        console.error("Data to edit is undefined for section:", section);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not find the item to edit. It may have been deleted.",
        });
        return;
    }

    setEditFormData(JSON.parse(JSON.stringify(dataToEdit ?? null)));
    setEditingSection(section);
  };
  
  const handleFormSave = () => {
    if (!editingSection || !editFormData) return;
    
    handleUpdate(draft => {
      switch (editingSection.type) {
        case 'contact':
            draft.name = editFormData.name;
            draft.email = editFormData.email;
            draft.phone = editFormData.phone;
            break;
        case 'summary':
            draft.summary = editFormData.summary;
            break;
        case 'experience': {
            const index = draft.experience.findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.experience[index] = editFormData;
            break;
        }
        case 'education': {
            const index = draft.education.findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.education[index] = editFormData;
            break;
        }
        case 'websites': {
            const index = draft.websites.findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.websites[index] = editFormData;
            break;
        }
        case 'projects': {
            const index = draft.projects.findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.projects[index] = editFormData;
            break;
        }
        case 'customSections': {
            if (!draft.customSections) draft.customSections = [];
            const index = draft.customSections.findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.customSections[index] = editFormData;
            break;
        }
        case 'new_experience':
            draft.experience.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'new_education':
            draft.education.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'new_website':
            if (!draft.websites) draft.websites = [];
            draft.websites.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'new_project':
            if (!draft.projects) draft.projects = [];
            draft.projects.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'new_customSection':
            if (!draft.customSections) draft.customSections = [];
            draft.customSections.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'skills':
        case 'hobbies':
        case 'achievements':
            draft[editingSection.type] = editFormData;
            break;
      }
    });

    setEditingSection(null);
    setEditFormData(null);
  }

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const resumeForApi = stripIds(resume);
      const enhancedData = await enhanceResume(resumeForApi);

      // Re-add IDs for the client-side state
      const enhancedDataWithIds: ResumeDataWithIds = {
        ...enhancedData,
        experience: enhancedData.experience.map((exp, index) => ({ ...exp, id: resume.experience[index]?.id || crypto.randomUUID() })),
        education: enhancedData.education.map((edu, index) => ({ ...edu, id: resume.education[index]?.id || crypto.randomUUID() })),
        websites: (enhancedData.websites || []).map((site, index) => ({ ...site, id: resume.websites[index]?.id || crypto.randomUUID() })),
        projects: (enhancedData.projects || []).map((proj, index) => ({ ...proj, id: resume.projects[index]?.id || crypto.randomUUID() })),
        customSections: (enhancedData.customSections || []).map((sec, index) => ({ ...sec, id: resume.customSections?.[index]?.id || crypto.randomUUID() })),
        skills: enhancedData.skills || [],
        achievements: enhancedData.achievements || [],
        hobbies: enhancedData.hobbies || [],
      };

      setResume(enhancedDataWithIds);
      toast({ title: "Resume Enhanced!", description: "Your resume has been improved by AI." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Enhancement Failed", description: "There was an error enhancing your resume." });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleDownloadPdf = async () => {
      setIsDownloading(true);
      try {
          const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
          const pageWidth = doc.internal.pageSize.getWidth();
          const margin = 40;
          const contentWidth = pageWidth - margin * 2;
          let y = margin;
  
          // Helper function to check for page breaks
          const checkPageBreak = (height: number) => {
              if (y + height > doc.internal.pageSize.getHeight() - margin) {
                  doc.addPage();
                  y = margin;
              }
          };
  
          // --- RENDER HEADER ---
          doc.setFont('helvetica', 'bold').setFontSize(22).text(resume.name, pageWidth / 2, y, { align: 'center' });
          y += 25;
          const contactInfo = [resume.email, resume.phone, ...(resume.websites || []).map(w => w.url)].filter(Boolean).join(' | ');
          doc.setFont('helvetica', 'normal').setFontSize(10).text(contactInfo, pageWidth / 2, y, { align: 'center' });
          y += 30;
  
          // --- RENDER SECTIONS ---
          const renderSection = (title: string, body: () => void) => {
              checkPageBreak(40);
              doc.setFont('helvetica', 'bold').setFontSize(12).text(title.toUpperCase(), margin, y);
              doc.line(margin, y + 3, contentWidth + margin, y + 3); // Underline
              y += 20;
              body();
              y += 15; // Spacing after section
          };
  
          // Summary
          renderSection('Summary', () => {
              const summaryLines = doc.splitTextToSize(resume.summary, contentWidth);
              checkPageBreak(summaryLines.length * 12);
              doc.setFontSize(10).text(summaryLines, margin, y);
              y += summaryLines.length * 12;
          });
  
          // Experience
          if (resume.experience.length > 0) {
              renderSection('Experience', () => {
                  resume.experience.forEach(exp => {
                      checkPageBreak(50); // Rough estimate
                      doc.setFont('helvetica', 'bold').setFontSize(11).text(exp.title, margin, y);
                      doc.setFont('helvetica', 'normal').text(exp.dates, pageWidth - margin, y, { align: 'right' });
                      y += 14;
                      doc.setFont('helvetica', 'bold').text(exp.company, margin, y);
                      doc.setFont('helvetica', 'normal').text(exp.location, pageWidth - margin, y, { align: 'right' });
                      y += 14;
  
                      exp.responsibilities.forEach(resp => {
                          const respLines = doc.splitTextToSize(`- ${resp}`, contentWidth - 10);
                          checkPageBreak(respLines.length * 12);
                          doc.text(respLines, margin + 10, y);
                          y += respLines.length * 12 + 2;
                      });
                      y += 10;
                  });
              });
          }
          
          // Projects
          if (resume.projects && resume.projects.length > 0) {
              renderSection('Projects', () => {
                   resume.projects.forEach(proj => {
                        checkPageBreak(40);
                        doc.setFont('helvetica', 'bold').setFontSize(11).text(proj.name, margin, y);
                         if (proj.url) {
                            doc.setFont('helvetica', 'normal').setTextColor(66, 133, 244).textWithLink('Link', pageWidth - margin, y, { url: proj.url, align: 'right' });
                            doc.setTextColor(0,0,0);
                         }
                        y += 14;
                        const descLines = doc.splitTextToSize(proj.description, contentWidth);
                        doc.setFont('helvetica', 'normal').text(descLines, margin, y);
                        y += descLines.length * 12 + 4;
                        doc.setFont('helvetica', 'italic').text(`Technologies: ${proj.technologies.join(', ')}`, margin, y);
                        y += 12;
                   });
              });
          }

          // Education
          if (resume.education.length > 0) {
              renderSection('Education', () => {
                  resume.education.forEach(edu => {
                      checkPageBreak(30);
                      doc.setFont('helvetica', 'bold').setFontSize(11).text(edu.degree, margin, y);
                      doc.setFont('helvetica', 'normal').text(edu.dates, pageWidth - margin, y, { align: 'right' });
                      y += 14;
                      doc.text(`${edu.school}, ${edu.location}`, margin, y);
                      y += 14;
                  });
              });
          }

          // Custom Sections
          if (resume.customSections && resume.customSections.length > 0) {
            resume.customSections.forEach(sec => {
              renderSection(sec.title, () => {
                const contentLines = doc.splitTextToSize(sec.content, contentWidth);
                checkPageBreak(contentLines.length * 12);
                doc.setFontSize(10).text(contentLines, margin, y);
                y += contentLines.length * 12;
              });
            });
          }
  
          // Skills
          renderSection('Skills', () => {
              const skillsLines = doc.splitTextToSize(resume.skills.join(', '), contentWidth);
              checkPageBreak(skillsLines.length * 12);
              doc.setFontSize(10).text(skillsLines, margin, y);
              y += skillsLines.length * 12;
          });
  
          doc.save(`${resume.name.replace(/\s+/g, '_') || 'resume'}_${template}_resume.pdf`);
      } catch (error) {
          console.error("PDF Download failed:", error);
          toast({ variant: "destructive", title: "Download Failed", description: "There was an error generating the PDF." });
      } finally {
          setIsDownloading(false);
      }
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
        const createTextRuns = (text: string) => text.split('\n').flatMap((line, i) => i > 0 ? [new TextRun({ break: 1 }), new TextRun(line)] : [new TextRun(line)]);

        const children: Paragraph[] = [
            new Paragraph({ text: resume.name, heading: HeadingLevel.TITLE }),
            new Paragraph({ text: [resume.email, resume.phone].filter(Boolean).join(" | ") }),
        ];
        if (resume.websites && resume.websites.length > 0) {
            children.push(new Paragraph({ text: resume.websites.map(w => w.url).join(" | ") }));
        }
        children.push(new Paragraph("")); // Spacer

        children.push(new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_1 }));
        children.push(new Paragraph({ children: createTextRuns(resume.summary)}));
        children.push(new Paragraph(""));

        children.push(new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_1 }));
        resume.experience.forEach(exp => {
            children.push(new Paragraph({ children: [new TextRun({ text: exp.title, bold: true }), new TextRun(` - ${exp.company}`)]}));
            children.push(new Paragraph({ children: [new TextRun({ text: `${exp.location} | ${exp.dates}`, italics: true })]}));
            exp.responsibilities.forEach(resp => children.push(new Paragraph({ text: resp, bullet: { level: 0 } })));
            children.push(new Paragraph(""));
        });
        
        if (resume.projects && resume.projects.length > 0) {
            children.push(new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_1 }));
            resume.projects.forEach(proj => {
                children.push(new Paragraph({ children: [new TextRun({ text: proj.name, bold: true })]}));
                if(proj.url) children.push(new Paragraph({ text: proj.url }));
                children.push(new Paragraph({ children: createTextRuns(proj.description)}));
                children.push(new Paragraph({ text: `Technologies: ${proj.technologies.join(", ")}`, style: "IntenseQuote"}));
                children.push(new Paragraph(""));
            });
        }
        
        children.push(new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_1 }));
        resume.education.forEach(edu => {
            children.push(new Paragraph({ children: [new TextRun({ text: `${edu.degree}, ${edu.school}`, bold: true })]}));
            children.push(new Paragraph({ children: [new TextRun({ text: `${edu.location} | ${edu.dates}`, italics: true })]}));
            children.push(new Paragraph(""));
        });

        if (resume.customSections && resume.customSections.length > 0) {
          resume.customSections.forEach(sec => {
            children.push(new Paragraph({ text: sec.title, heading: HeadingLevel.HEADING_1 }));
            children.push(new Paragraph({ children: createTextRuns(sec.content) }));
            children.push(new Paragraph(""));
          });
        }

        children.push(new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_1 }));
        children.push(new Paragraph(resume.skills.join(", ")));
        children.push(new Paragraph(""));

        if (resume.achievements && resume.achievements.length > 0) {
            children.push(new Paragraph({ text: "Achievements", heading: HeadingLevel.HEADING_1 }));
            resume.achievements.forEach(ach => children.push(new Paragraph({ text: ach, bullet: { level: 0 } })));
            children.push(new Paragraph(""));
        }
        
        if (resume.hobbies && resume.hobbies.length > 0) {
            children.push(new Paragraph({ text: "Hobbies & Interests", heading: HeadingLevel.HEADING_1 }));
            children.push(new Paragraph(resume.hobbies.join(", ")));
        }

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${resume.name.replace(/\s+/g, "_") || "resume"}_resume.docx`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Download Failed", description: "There was an error generating the DOCX file." });
    } finally {
      setIsDownloading(false);
    }
  };

  const editorDisabled = isDownloading || isEnhancing;
  
  const removeItem = (type: 'experience' | 'education' | 'websites' | 'projects' | 'customSections', id: string) => {
    handleUpdate(draft => {
      switch (type) {
        case 'experience':
            draft.experience = draft.experience.filter(item => item.id !== id);
            break;
        case 'education':
            draft.education = draft.education.filter(item => item.id !== id);
            break;
        case 'websites':
            draft.websites = (draft.websites || []).filter(item => item.id !== id);
            break;
        case 'projects':
            draft.projects = (draft.projects || []).filter(item => item.id !== id);
            break;
        case 'customSections':
            draft.customSections = (draft.customSections || []).filter(item => item.id !== id);
            break;
      }
    });
  }

  const renderEditDialog = () => {
    if (!editingSection || !editFormData) return null;
    let title = "Edit Section";
    let content = null;

    switch(editingSection.type) {
        case 'contact':
            title = "Edit Contact Information"
            content = (
                <div className="space-y-4">
                    <CustomInput label="Name" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                    <CustomInput label="Email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
                    <CustomInput label="Phone" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
                </div>
            );
            break;
        case 'summary':
            title = "Edit Summary"
            content = <CustomTextarea value={editFormData.summary} onChange={(e) => setEditFormData({summary: e.target.value})} rows={6} />;
            break;
        case 'new_experience':
        case 'experience':
            title = editingSection.type === 'new_experience' ? "Add Experience" : "Edit Experience";
            content = (
                <div className="space-y-4">
                    <CustomInput label="Title" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} />
                    <CustomInput label="Company" value={editFormData.company} onChange={(e) => setEditFormData({...editFormData, company: e.target.value})} />
                    <CustomInput label="Location" value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
                    <CustomInput label="Dates" value={editFormData.dates} onChange={(e) => setEditFormData({...editFormData, dates: e.target.value})} />
                    <label className="block text-sm font-medium text-foreground">Responsibilities</label>
                    {editFormData.responsibilities.map((resp: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <Textarea value={resp} onChange={(e) => {
                                const newResp = [...editFormData.responsibilities];
                                newResp[index] = e.target.value;
                                setEditFormData({...editFormData, responsibilities: newResp});
                            }} rows={2}/>
                            <Button variant="ghost" size="icon" onClick={() => {
                                 const newResp = editFormData.responsibilities.filter((_:any, i:number) => i !== index);
                                 setEditFormData({...editFormData, responsibilities: newResp});
                            }}><Trash2 /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditFormData({...editFormData, responsibilities: [...editFormData.responsibilities, ""]})}><PlusCircle className="mr-2"/> Add Responsibility</Button>
                </div>
            )
            break;
        case 'new_education':
        case 'education':
             title = editingSection.type === 'new_education' ? "Add Education" : "Edit Education";
             content = (
                <div className="space-y-4">
                    <CustomInput label="Degree" value={editFormData.degree} onChange={e => setEditFormData({...editFormData, degree: e.target.value})} />
                    <CustomInput label="School" value={editFormData.school} onChange={e => setEditFormData({...editFormData, school: e.target.value})} />
                    <CustomInput label="Location" value={editFormData.location} onChange={e => setEditFormData({...editFormData, location: e.target.value})} />
                    <CustomInput label="Dates" value={editFormData.dates} onChange={e => setEditFormData({...editFormData, dates: e.target.value})} />
                </div>
             );
             break;
        case 'new_project':
        case 'projects':
            title = editingSection.type === 'new_project' ? "Add Project" : "Edit Project";
            content = (
                <div className="space-y-4">
                    <CustomInput label="Project Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                    <CustomInput label="Project URL" value={editFormData.url} onChange={e => setEditFormData({...editFormData, url: e.target.value})} />
                    <CustomTextarea label="Description" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} rows={4} />
                    <CustomInput label="Technologies (comma-separated)" value={(editFormData.technologies || []).join(", ")} onChange={e => setEditFormData({...editFormData, technologies: e.target.value.split(',').map(t => t.trim())})} />
                </div>
            )
            break;
        case 'new_website':
        case 'websites':
             title = editingSection.type === 'new_website' ? "Add Website" : "Edit Website";
             content = (
                <div className="space-y-4">
                    <CustomInput label="Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} placeholder="e.g. LinkedIn, GitHub" />
                    <CustomInput label="URL" value={editFormData.url} onChange={e => setEditFormData({...editFormData, url: e.target.value})} />
                </div>
             );
             break;
        case 'new_customSection':
        case 'customSections':
            title = editingSection.type === 'new_customSection' ? "Add Custom Section" : "Edit Custom Section";
            content = (
                <div className="space-y-4">
                    <CustomInput label="Section Title" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
                    <CustomTextarea label="Content" value={editFormData.content} onChange={e => setEditFormData({...editFormData, content: e.target.value})} rows={6} />
                </div>
            );
            break;
        case 'skills':
            title = "Edit Skills";
            content = (
                <CustomTextarea
                    label="Skills (comma-separated)"
                    value={(editFormData || []).join(', ')}
                    onChange={(e) => setEditFormData(e.target.value.split(',').map(s => s.trim()))}
                    rows={4}
                    placeholder="e.g. React, TypeScript, Project Management"
                />
            );
            break;
        case 'achievements':
            title = "Edit Achievements";
            content = (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-foreground">Achievements</label>
                    {(editFormData || []).map((ach: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <Textarea value={ach} onChange={(e) => {
                                const newAch = [...editFormData];
                                newAch[index] = e.target.value;
                                setEditFormData(newAch);
                            }} rows={2}/>
                            <Button variant="ghost" size="icon" onClick={() => {
                                 const newAch = editFormData.filter((_:any, i:number) => i !== index);
                                 setEditFormData(newAch);
                            }}><Trash2 /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditFormData([...(editFormData || []), ""])}><PlusCircle className="mr-2"/> Add Achievement</Button>
                </div>
            );
            break;
        case 'hobbies':
            title = "Edit Hobbies & Interests";
            content = (
                 <CustomTextarea
                    label="Hobbies (comma-separated)"
                    value={(editFormData || []).join(', ')}
                    onChange={(e) => setEditFormData(e.target.value.split(',').map(s => s.trim()))}
                    rows={4}
                    placeholder="e.g. Hiking, Reading, Photography"
                />
            );
            break;
    }
    
    return (
        <Dialog open={!!editingSection} onOpenChange={() => setEditingSection(null)}>
            <DialogContent>
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {content}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleFormSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
  }

  return (
     <div className="flex h-screen bg-background">
      {/* Editor Column */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
            <Button variant="ghost" onClick={onBack} className="hidden sm:flex">
                <ChevronLeft className="mr-2" /> Back to Home
            </Button>
             <h2 className="text-lg font-semibold">Resume Editor</h2>
            <div className="flex items-center gap-2">
                <Button onClick={undo} disabled={!canUndo || editorDisabled} variant="outline" size="icon">
                  <Undo /><span className="sr-only">Undo</span>
                </Button>
                <Button onClick={redo} disabled={!canRedo || editorDisabled} variant="outline" size="icon">
                  <Redo /><span className="sr-only">Redo</span>
                </Button>
                <Button onClick={handleEnhance} disabled={editorDisabled} variant="outline" size="sm">
                  {isEnhancing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  <span className="hidden sm:inline ml-2">Enhance</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" disabled={editorDisabled || isDownloading}>
                      {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
                      <span className="hidden sm:inline ml-2">Download</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleDownloadPdf}>PDF</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadDocx}>DOCX</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 overflow-y-auto">
            {/* Left side: Controls and Add Buttons */}
            <aside className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Template</CardTitle></CardHeader>
                    <CardContent>
                       <Select value={template} onValueChange={setTemplate}>
                            <SelectTrigger><SelectValue placeholder="Change template" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="modern">Modern</SelectItem>
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="executive">Executive</SelectItem>
                                <SelectItem value="minimalist">Minimalist</SelectItem>
                                <SelectItem value="creative">Creative</SelectItem>
                                <SelectItem value="academic">Academic</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="elegant">Elegant</SelectItem>
                                <SelectItem value="compact">Compact</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader><CardTitle>Add Sections</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                       <Button variant="outline" onClick={() => handleEdit({ type: 'new_experience' })}><PlusCircle/>Experience</Button>
                       <Button variant="outline" onClick={() => handleEdit({ type: 'new_education' })}><PlusCircle/>Education</Button>
                       <Button variant="outline" onClick={() => handleEdit({ type: 'new_project' })}><PlusCircle/>Project</Button>
                       <Button variant="outline" onClick={() => handleEdit({ type: 'new_website' })}><PlusCircle/>Website</Button>
                       <Button variant="outline" onClick={() => handleEdit({ type: 'new_customSection' })}><PlusCircle/>Custom Section</Button>
                    </CardContent>
                </Card>
            </aside>

            {/* Right side: Interactive Resume Preview */}
            <div className="lg:col-span-1">
                 <ScrollArea className="h-full">
                    <div className="p-4 bg-gray-800 rounded-lg">
                       <ResumePreview 
                           ref={previewRef} 
                           resumeData={resume} 
                           templateName={template} 
                           onEdit={handleEdit}
                           onRemove={removeItem}
                           isEditable
                       />
                    </div>
                 </ScrollArea>
            </div>
        </main>
      </div>

      {renderEditDialog()}
    </div>
  );
}

// Re-add label prop to Input and Textarea for use in modals
const CustomInput = React.forwardRef<HTMLInputElement, {label?:string} & React.ComponentProps<typeof Input>>(({ className, type, label, ...props }, ref) => {
    const id = React.useId();
    if (!label) {
        return <Input type={type} className={className} ref={ref} {...props}/>
    }
    return (
        <div className="grid w-full items-center gap-1.5">
            <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
            <Input id={id} type={type} className={className} ref={ref} {...props} />
        </div>
    );
});
CustomInput.displayName = "Input";

const CustomTextarea = React.forwardRef<HTMLTextAreaElement, {label?: string} & React.ComponentProps<typeof Textarea>>(({ className, label, ...props }, ref) => {
    const id = React.useId();
    if (!label) {
        return <Textarea className={className} ref={ref} {...props} />
    }
    return (
      <div className="grid w-full gap-1.5">
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
        <Textarea id={id} className={className} ref={ref} {...props} />
      </div>
    )
});
CustomTextarea.displayName = "Textarea";
