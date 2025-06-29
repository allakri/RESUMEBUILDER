
"use client";

import React, { useRef, useState } from "react";
import {
  Award,
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
import type { ResumeData, ResumeDataWithIds } from "@/ai/resume-schema";
import { enhanceResume } from "@/ai/flows/enhance-resume";
import { chatEnhanceResume } from "@/ai/flows/chat-enhance-resume";
import { atsScorecard } from "@/ai/flows/ats-scorecard";
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
import { Skeleton } from "./ui/skeleton";

interface ResumeEditorProps {
  initialResumeData: ResumeDataWithIds;
  onBack: () => void;
}

// Helper to ensure all list items have a client-side ID.
// The AI may create new items without an ID, so we need to add one.
const assignIdsToResume = (resume: ResumeData): ResumeDataWithIds => {
    const ensureUniqueIds = (arr: any[] = []) => {
        const seenIds = new Set<string>();
        return (arr || []).map(item => {
            let newId = item.id || crypto.randomUUID();
            while (seenIds.has(newId)) {
                newId = crypto.randomUUID();
            }
            seenIds.add(newId);
            return { ...item, id: newId };
        });
    };

    return {
        ...resume,
        experience: ensureUniqueIds(resume.experience),
        education: ensureUniqueIds(resume.education),
        websites: ensureUniqueIds(resume.websites || []),
        projects: ensureUniqueIds(resume.projects || []),
        customSections: ensureUniqueIds(resume.customSections || []),
        // Ensure optional fields that are just string arrays exist
        skills: resume.skills || [],
        achievements: resume.achievements || [],
        hobbies: resume.hobbies || [],
    } as ResumeDataWithIds;
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
  const [isChatEnhancing, setIsChatEnhancing] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const { toast } = useToast();

  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  // State for ATS Scorecard
  const [jobCriteria, setJobCriteria] = useState("");
  const [atsResult, setAtsResult] = useState<{ score: number; justification: string } | null>(null);
  const [isScoring, setIsScoring] = useState(false);


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
            if (index > -1) draft.experience[index] = { ...editFormData, id: editingSection.id };
            break;
        }
        case 'education': {
            const index = draft.education.findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.education[index] = { ...editFormData, id: editingSection.id };
            break;
        }
        case 'websites': {
            const index = (draft.websites ?? []).findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.websites[index] = { ...editFormData, id: editingSection.id };
            break;
        }
        case 'projects': {
            const index = (draft.projects ?? []).findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.projects[index] = { ...editFormData, id: editingSection.id };
            break;
        }
        case 'customSections': {
            if (!draft.customSections) draft.customSections = [];
            const index = (draft.customSections ?? []).findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.customSections[index] = { ...editFormData, id: editingSection.id };
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
      const enhancedData = await enhanceResume(resume);
      const finalResume = assignIdsToResume(enhancedData);
      setResume(finalResume);
      toast({ title: "Resume Enhanced!", description: "Your resume has been improved by AI." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Enhancement Failed", description: "There was an error enhancing your resume." });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleChatEnhance = async () => {
    if (!chatQuery.trim()) {
        toast({ title: "Please enter a request.", variant: "destructive" });
        return;
    }
    setIsChatEnhancing(true);
    try {
        const enhancedData = await chatEnhanceResume({ resume, query: chatQuery });
        const finalResume = assignIdsToResume(enhancedData);
        setResume(finalResume);
        setChatQuery("");
        toast({ title: "AI Enhancement Complete!", description: "Your resume has been updated based on your request." });
    } catch (error) {
        console.error("Chat enhancement failed:", error);
        toast({ variant: "destructive", title: "Enhancement Failed", description: "The AI assistant could not process your request." });
    } finally {
        setIsChatEnhancing(false);
    }
  };

  const convertResumeToString = (res: ResumeDataWithIds): string => {
    let resumeText = `Name: ${res.name}\nEmail: ${res.email}\nPhone: ${res.phone}\n\n`;
    resumeText += `Summary:\n${res.summary}\n\n`;

    resumeText += "Experience:\n";
    res.experience.forEach(exp => {
        resumeText += `- ${exp.title} at ${exp.company} (${exp.dates}, ${exp.location})\n`;
        exp.responsibilities.forEach(r => {
            resumeText += `  - ${r}\n`;
        });
    });
    resumeText += "\n";

    resumeText += "Education:\n";
    res.education.forEach(edu => {
        resumeText += `- ${edu.degree} from ${edu.school} (${edu.dates}, ${edu.location})\n`;
    });
    resumeText += "\n";

    if (res.projects?.length) {
        resumeText += "Projects:\n";
        res.projects.forEach(proj => {
            resumeText += `- ${proj.name}: ${proj.description} (Tech: ${proj.technologies.join(', ')})\n`;
        });
        resumeText += "\n";
    }

    resumeText += `Skills: ${res.skills.join(', ')}\n`;
    return resumeText;
  };
  
  const handleScoreResume = async () => {
      if (!jobCriteria) {
          toast({
              variant: "destructive",
              title: "Missing Job Description",
              description: "Please provide a job description or criteria.",
          });
          return;
      }
      setIsScoring(true);
      setAtsResult(null);
      try {
          const resumeText = convertResumeToString(resume);
          const scoreResult = await atsScorecard({ resumeText, criteria: jobCriteria });
          setAtsResult(scoreResult);
      } catch (error) {
          console.error("Scoring failed:", error);
          toast({
              variant: "destructive",
              title: "Scoring Failed",
              description: "There was an error scoring your resume.",
          });
      } finally {
          setIsScoring(false);
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
  
          const checkPageBreak = (height: number) => {
              if (y + height > doc.internal.pageSize.getHeight() - margin) {
                  doc.addPage();
                  y = margin;
              }
          };
  
          doc.setFont('helvetica', 'bold').setFontSize(22).text(resume.name, pageWidth / 2, y, { align: 'center' });
          y += 25;
          const contactInfo = [resume.email, resume.phone, ...(resume.websites || []).map(w => w.url)].filter(Boolean).join(' | ');
          doc.setFont('helvetica', 'normal').setFontSize(10).text(contactInfo, pageWidth / 2, y, { align: 'center' });
          y += 30;
  
          const renderSection = (title: string, body: () => void) => {
              checkPageBreak(40);
              doc.setFont('helvetica', 'bold').setFontSize(12).text(title.toUpperCase(), margin, y);
              doc.line(margin, y + 3, contentWidth + margin, y + 3);
              y += 20;
              body();
              y += 15;
          };
  
          renderSection('Summary', () => {
              const summaryLines = doc.splitTextToSize(resume.summary, contentWidth);
              checkPageBreak(summaryLines.length * 12);
              doc.setFontSize(10).text(summaryLines, margin, y);
              y += summaryLines.length * 12;
          });
  
          if (resume.experience.length > 0) {
              renderSection('Experience', () => {
                  resume.experience.forEach(exp => {
                      checkPageBreak(50);
                      doc.setFont('helvetica', 'bold').setFontSize(11).text(exp.title, margin, y);
                      doc.setFont('helvetica', 'normal').text(exp.dates, pageWidth - margin, y, { align: 'right' });
                      y += 14;
                      doc.setFont('helvetica', 'bold').text(exp.company, margin, y);
                      doc.setFont('helvetica', 'normal').text(exp.location, pageWidth - margin, y, { align: 'right' });
                      y += 14;
  
                      exp.responsibilities.forEach(resp => {
                          const respLines = doc.splitTextToSize(`- ${resp}`, contentWidth - 10);
                          checkPageBreak(respLines.length * 12 + 2);
                          doc.text(respLines, margin + 10, y);
                          y += respLines.length * 12 + 2;
                      });
                      y += 10;
                  });
              });
          }
          
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
        children.push(new Paragraph(""));

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

  const editorDisabled = isDownloading || isEnhancing || isChatEnhancing || isScoring;
  
  const removeItem = (type: 'experience' | 'education' | 'websites' | 'projects' | 'customSections', id: string) => {
    handleUpdate(draft => {
      const prop = type;
      if (Array.isArray(draft[prop])) {
        (draft as any)[prop] = (draft as any)[prop].filter((item: any) => item.id !== id);
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
                    {(editFormData.responsibilities || []).map((resp: string, index: number) => (
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
                    <Button variant="outline" size="sm" onClick={() => setEditFormData({...editFormData, responsibilities: [...(editFormData.responsibilities || []), ""]})}><PlusCircle className="mr-2"/> Add Responsibility</Button>
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

                <Card>
                    <CardHeader><CardTitle>ATS Scorecard</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Paste a job description below to see how well your resume matches.
                        </p>
                        <Textarea
                            placeholder="Paste job description or criteria here..."
                            value={jobCriteria}
                            onChange={(e) => setJobCriteria(e.target.value)}
                            disabled={editorDisabled}
                            rows={6}
                        />
                        <Button onClick={handleScoreResume} disabled={editorDisabled || !jobCriteria} className="w-full">
                            {isScoring ? <Loader2 className="animate-spin" /> : <Award className="mr-2"/>}
                            Get ATS Score
                        </Button>
                        {(isScoring || atsResult) && (
                            <div className="space-y-4 pt-4">
                                {isScoring ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <Skeleton className="h-32 w-32 rounded-full" />
                                        <Skeleton className="h-4 w-4/5" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                ) : (
                                    atsResult && (
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex flex-col items-center gap-2">
                                            <ScoreCircle score={atsResult.score} />
                                            <p className="text-muted-foreground text-sm">Compatibility</p>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <h4 className="font-semibold text-primary">Justification</h4>
                                            <ScrollArea className="h-32">
                                                <p className="text-sm text-foreground/90 whitespace-pre-wrap pr-4">
                                                    {atsResult.justification}
                                                </p>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                    )
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>AI Assistant</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Describe the changes you'd like to make. For example, "Make my summary more punchy" or "Rewrite my last job's responsibilities to highlight leadership."
                        </p>
                        <Textarea
                            placeholder="Your request..."
                            value={chatQuery}
                            onChange={(e) => setChatQuery(e.target.value)}
                            disabled={editorDisabled}
                            rows={4}
                        />
                        <Button onClick={handleChatEnhance} disabled={editorDisabled} className="w-full">
                            {isChatEnhancing ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2"/>}
                            Enhance with Chat
                        </Button>
                    </CardContent>
                </Card>
            </aside>

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

const ScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative h-32 w-32">
        <svg className="transform -rotate-90" width="128" height="128">
          <circle
            className="text-secondary"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="64"
            cy="64"
          />
          <circle
            className="text-primary transition-all duration-1000 ease-out"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r="45"
            cx="64"
            cy="64"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-headline text-3xl font-bold text-primary">
          {score}
        </span>
      </div>
    );
};

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
