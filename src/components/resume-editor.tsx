
"use client";

import React, { useRef, useState } from "react";
import {
  Award,
  Briefcase,
  ChevronLeft,
  Download,
  FileText,
  GraduationCap,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  Pencil,
  PlusCircle,
  PlusSquare,
  Redo,
  Smile,
  Sparkles,
  Trash2,
  Undo,
  User,
  View,
  Wrench,
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface ResumeEditorProps {
  initialResumeData: ResumeDataWithIds;
  onBack: () => void;
}

const SECTIONS = [
  { id: 'contact', title: 'Contact Info', icon: User },
  { id: 'summary', title: 'Summary', icon: FileText },
  { id: 'experience', title: 'Experience', icon: Briefcase },
  { id: 'education', title: 'Education', icon: GraduationCap },
  { id: 'projects', title: 'Projects', icon: Lightbulb },
  { id: 'skills', title: 'Skills', icon: Wrench },
  { id: 'websites', title: 'Websites & Links', icon: LinkIcon },
  { id: 'achievements', title: 'Achievements', icon: Award },
  { id: 'hobbies', title: 'Hobbies', icon: Smile },
  { id: 'customSections', title: 'Custom Sections', icon: PlusSquare },
];


// Helper to ensure all list items have a client-side ID.
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
  } = useHistoryState<ResumeDataWithIds>(assignIdsToResume(initialResumeData));

  const [template, setTemplate] = useState("modern");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isChatEnhancing, setIsChatEnhancing] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const { toast } = useToast();

  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  const [jobCriteria, setJobCriteria] = useState("");
  const [atsResult, setAtsResult] = useState<{ score: number; justification: string } | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const [activeView, setActiveView] = useState<'editor' | 'preview'>('editor');
  const [activeSection, setActiveSection] = useState<string>('contact');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);


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
        dataToEdit = { name: "", description: "", technologies: [""], url: "" };
        break;
      case 'new_customSection':
        dataToEdit = { title: "New Section", content: "" };
        break;
      case 'skills':
        dataToEdit = resume.skills ?? [];
        break;
      case 'hobbies':
        dataToEdit = resume.hobbies ?? [];
        break;
      case 'achievements':
        dataToEdit = resume.achievements ?? [];
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
            if (!draft.websites) draft.websites = [];
            const index = (draft.websites ?? []).findIndex(item => item.id === editingSection.id);
            if (index > -1) draft.websites[index] = { ...editFormData, id: editingSection.id };
            break;
        }
        case 'projects': {
            if (!draft.projects) draft.projects = [];
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
          draft.skills = editFormData;
          break;
        case 'hobbies':
            draft.hobbies = editFormData;
            break;
        case 'achievements':
            draft.achievements = editFormData;
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

    if (res.experience?.length) {
        resumeText += "Experience:\n";
        res.experience.forEach(exp => {
            resumeText += `- ${exp.title} at ${exp.company} (${exp.dates}, ${exp.location})\n`;
            exp.responsibilities.forEach(r => {
                resumeText += `  - ${r}\n`;
            });
        });
        resumeText += "\n";
    }

    if (res.education?.length) {
        resumeText += "Education:\n";
        res.education.forEach(edu => {
            resumeText += `- ${edu.degree} from ${edu.school} (${edu.dates}, ${edu.location})\n`;
        });
        resumeText += "\n";
    }

    if (res.projects?.length) {
        resumeText += "Projects:\n";
        res.projects.forEach(proj => {
            resumeText += `- ${proj.name}: ${proj.description} (Tech: ${proj.technologies.join(', ')})\n`;
        });
        resumeText += "\n";
    }

    if (res.skills?.length) {
        resumeText += `Skills: ${res.skills.join(', ')}\n\n`;
    }
    
    if (res.achievements?.length) {
        resumeText += `Achievements: ${res.achievements.join(', ')}\n\n`;
    }
    
    if (res.customSections?.length) {
        res.customSections.forEach(sec => {
            resumeText += `${sec.title}:\n${sec.content}\n\n`;
        });
    }

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
          
          const contactParts = [resume.email, resume.phone].filter(Boolean);
          if (resume.websites && resume.websites.length > 0) {
              resume.websites.forEach(w => contactParts.push(w.url));
          }
          const contactInfo = contactParts.join(' | ');
          doc.setFont('helvetica', 'normal').setFontSize(10).text(contactInfo, pageWidth / 2, y, { align: 'center' });
          y += 30;
  
          const renderSection = (title: string, body: () => void) => {
              checkPageBreak(40);
              doc.setFont('helvetica', 'bold').setFontSize(12).text(title.toUpperCase(), margin, y);
              doc.setDrawColor(0).setLineWidth(1).line(margin, y + 3, contentWidth + margin, y + 3);
              y += 20;
              body();
              y += 15;
          };
  
          if(resume.summary) {
            renderSection('Summary', () => {
                const summaryLines = doc.splitTextToSize(resume.summary, contentWidth);
                checkPageBreak(summaryLines.length * 12);
                doc.setFontSize(10).setFont('helvetica', 'normal').text(summaryLines, margin, y);
                y += summaryLines.length * 12;
            });
          }
  
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
                          const respLines = doc.splitTextToSize(`• ${resp}`, contentWidth - 10);
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
                        checkPageBreak(descLines.length * 12 + 16);
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
                doc.setFontSize(10).setFont('helvetica', 'normal').text(contentLines, margin, y);
                y += contentLines.length * 12;
              });
            });
          }
  
          if (resume.skills.length > 0) {
            renderSection('Skills', () => {
                const skillsText = resume.skills.join(' • ');
                const skillsLines = doc.splitTextToSize(skillsText, contentWidth);
                checkPageBreak(skillsLines.length * 12);
                doc.setFontSize(10).setFont('helvetica', 'normal').text(skillsLines, margin, y);
                y += skillsLines.length * 12;
            });
          }
          
          if (resume.achievements && resume.achievements.length > 0) {
            renderSection('Achievements', () => {
                resume.achievements.forEach(ach => {
                    const achLines = doc.splitTextToSize(`• ${ach}`, contentWidth - 10);
                    checkPageBreak(achLines.length * 12 + 2);
                    doc.text(achLines, margin + 10, y);
                    y += achLines.length * 12 + 2;
                });
            });
          }
          
          if (resume.hobbies && resume.hobbies.length > 0) {
            renderSection('Hobbies & Interests', () => {
                const hobbiesText = resume.hobbies.join(' • ');
                const hobbiesLines = doc.splitTextToSize(hobbiesText, contentWidth);
                checkPageBreak(hobbiesLines.length * 12);
                doc.setFontSize(10).setFont('helvetica', 'normal').text(hobbiesLines, margin, y);
                y += hobbiesLines.length * 12;
            });
          }
  
          doc.save(`${resume.name.replace(/\s+/g, '_') || 'resume'}_professional_resume.pdf`);
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
            new Paragraph({ text: resume.name, heading: HeadingLevel.TITLE, alignment: 'center' }),
            new Paragraph({ text: [resume.email, resume.phone].filter(Boolean).join(" | "), alignment: 'center' }),
        ];
        if (resume.websites && resume.websites.length > 0) {
            children.push(new Paragraph({ text: resume.websites.map(w => w.url).join(" | "), alignment: 'center' }));
        }
        children.push(new Paragraph(""));

        const addSection = (title: string, body: () => void) => {
            children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }));
            body();
            children.push(new Paragraph(""));
        };

        if (resume.summary) {
            addSection('Summary', () => {
                children.push(new Paragraph({ children: createTextRuns(resume.summary)}));
            });
        }

        if (resume.experience.length > 0) {
            addSection('Experience', () => {
                resume.experience.forEach(exp => {
                    children.push(new Paragraph({ children: [new TextRun({ text: exp.title, bold: true }), new TextRun({text: ` at ${exp.company}`, bold: true})]}));
                    children.push(new Paragraph({ children: [new TextRun({ text: `${exp.location} | ${exp.dates}`, italics: true })]}));
                    exp.responsibilities.forEach(resp => children.push(new Paragraph({ text: resp, bullet: { level: 0 } })));
                    children.push(new Paragraph(""));
                });
            });
        }
        
        if (resume.projects && resume.projects.length > 0) {
            addSection('Projects', () => {
                resume.projects.forEach(proj => {
                    children.push(new Paragraph({ children: [new TextRun({ text: proj.name, bold: true })]}));
                    if(proj.url) children.push(new Paragraph({ text: proj.url, style: "Hyperlink" }));
                    children.push(new Paragraph({ children: createTextRuns(proj.description)}));
                    children.push(new Paragraph({ children: [new TextRun({text: 'Technologies: ', bold: true}), new TextRun(proj.technologies.join(", "))]}));
                    children.push(new Paragraph(""));
                });
            });
        }
        
        if (resume.education.length > 0) {
            addSection('Education', () => {
                resume.education.forEach(edu => {
                    children.push(new Paragraph({ children: [new TextRun({ text: `${edu.degree}, ${edu.school}`, bold: true })]}));
                    children.push(new Paragraph({ children: [new TextRun({ text: `${edu.location} | ${edu.dates}`, italics: true })]}));
                    children.push(new Paragraph(""));
                });
            });
        }

        if (resume.customSections && resume.customSections.length > 0) {
          resume.customSections.forEach(sec => {
            addSection(sec.title, () => {
                children.push(new Paragraph({ children: createTextRuns(sec.content) }));
            });
          });
        }

        if (resume.skills.length > 0) {
            addSection('Skills', () => {
                children.push(new Paragraph(resume.skills.join(", ")));
            });
        }

        if (resume.achievements && resume.achievements.length > 0) {
            addSection('Achievements', () => {
                resume.achievements.forEach(ach => children.push(new Paragraph({ text: ach, bullet: { level: 0 } })));
            });
        }
        
        if (resume.hobbies && resume.hobbies.length > 0) {
            addSection('Hobbies & Interests', () => {
                children.push(new Paragraph(resume.hobbies.join(", ")));
            });
        }

        const doc = new Document({ 
            styles: {
                paragraph: {
                    run: { font: "PT Sans", size: 22 }, // 11pt
                },
                heading1: {
                    run: { font: "Poppins", size: 28, bold: true }, // 14pt
                    paragraph: { spacing: { after: 120 } } // 6pt
                },
                title: {
                    run: { font: "Poppins", size: 44, bold: true }, // 22pt
                    paragraph: { spacing: { after: 120 } }
                },
            },
            sections: [{ children }] 
        });
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
      if (Array.isArray((draft as any)[prop])) {
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
                    <CustomInput label="Full Name" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                    <CustomInput label="Email Address" type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
                    <CustomInput label="Phone Number" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
                </div>
            );
            break;
        case 'summary':
            title = "Edit Professional Summary"
            content = <CustomTextarea label="Summary" value={editFormData.summary} onChange={(e) => setEditFormData({summary: e.target.value})} rows={6} />;
            break;
        case 'new_experience':
        case 'experience':
            title = editingSection.type === 'new_experience' ? "Add Experience" : "Edit Experience";
            content = (
                <div className="space-y-4">
                    <CustomInput label="Job Title" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} />
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
                            }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditFormData({...editFormData, responsibilities: [...(editFormData.responsibilities || []), ""]})}><PlusCircle className="mr-2 h-4 w-4"/> Add Responsibility</Button>
                </div>
            )
            break;
        case 'new_education':
        case 'education':
             title = editingSection.type === 'new_education' ? "Add Education" : "Edit Education";
             content = (
                <div className="space-y-4">
                    <CustomInput label="Degree / Certificate" value={editFormData.degree} onChange={e => setEditFormData({...editFormData, degree: e.target.value})} />
                    <CustomInput label="School / Institution" value={editFormData.school} onChange={e => setEditFormData({...editFormData, school: e.target.value})} />
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
                    <CustomInput label="Project URL" value={editFormData.url ?? ""} onChange={e => setEditFormData({...editFormData, url: e.target.value})} />
                    <CustomTextarea label="Description" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} rows={4} />
                    <CustomInput label="Technologies (comma-separated)" value={(editFormData.technologies || []).join(", ")} onChange={e => setEditFormData({...editFormData, technologies: e.target.value.split(',').map(t => t.trim())})} />
                </div>
            )
            break;
        case 'new_website':
        case 'websites':
             title = editingSection.type === 'new_website' ? "Add Website/Link" : "Edit Website/Link";
             content = (
                <div className="space-y-4">
                    <CustomInput label="Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} placeholder="e.g. LinkedIn, GitHub Portfolio" />
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
                            }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setEditFormData([...(editFormData || []), ""])}><PlusCircle className="mr-2 h-4 w-4"/> Add Achievement</Button>
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
        <Dialog open={!!editingSection} onOpenChange={(isOpen) => { if(!isOpen) { setEditingSection(null); setEditFormData(null); }}}>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-1 pr-4">
                    {content}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleFormSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
  }

  const renderSectionEditor = (sectionId: string) => {
    switch(sectionId) {
        case 'contact':
            return <SectionWrapper title="Contact Information" description="Provide your name and contact details.">
                <div className="space-y-4 max-w-lg">
                    <CustomInput label="Full Name" value={resume.name} onChange={e => handleUpdate(d => d.name = e.target.value)} />
                    <CustomInput label="Email" type="email" value={resume.email} onChange={e => handleUpdate(d => d.email = e.target.value)} />
                    <CustomInput label="Phone" value={resume.phone} onChange={e => handleUpdate(d => d.phone = e.target.value)} />
                </div>
            </SectionWrapper>
        case 'summary':
            return <SectionWrapper title="Professional Summary" description="Write a brief summary of your skills and experience.">
                 <CustomTextarea label="Summary" value={resume.summary} onChange={e => handleUpdate(d => d.summary = e.target.value)} rows={8} />
            </SectionWrapper>
        case 'experience':
            return <ListSectionWrapper
                title="Work Experience"
                description="Detail your professional roles and responsibilities."
                items={resume.experience}
                onAddItem={() => handleEdit({type: 'new_experience'})}
                renderItem={(item) => (
                    <>
                        <CardHeader>
                            <CardTitle>{item.title}</CardTitle>
                            <CardDescription>{item.company} | {item.location} | {item.dates}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ul className="list-disc pl-5 text-sm space-y-1">
                             {item.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                           </ul>
                        </CardContent>
                    </>
                )}
                onEditItem={(item) => handleEdit({type: 'experience', id: item.id})}
                onRemoveItem={(item) => removeItem('experience', item.id)}
            />
        case 'education':
            return <ListSectionWrapper
                title="Education"
                description="List your academic qualifications and degrees."
                items={resume.education}
                onAddItem={() => handleEdit({type: 'new_education'})}
                renderItem={(item) => (
                    <CardHeader>
                        <CardTitle>{item.degree}</CardTitle>
                        <CardDescription>{item.school} | {item.location} | {item.dates}</CardDescription>
                    </CardHeader>
                )}
                onEditItem={(item) => handleEdit({type: 'education', id: item.id})}
                onRemoveItem={(item) => removeItem('education', item.id)}
            />
        case 'projects':
            return <ListSectionWrapper
                title="Projects"
                description="Showcase your personal or professional projects."
                items={resume.projects || []}
                onAddItem={() => handleEdit({type: 'new_project'})}
                renderItem={(item) => (
                    <>
                     <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.technologies.join(', ')}</CardDescription>
                    </CardHeader>
                    <CardContent><p>{item.description}</p></CardContent>
                    </>
                )}
                onEditItem={(item) => handleEdit({type: 'projects', id: item.id})}
                onRemoveItem={(item) => removeItem('projects', item.id)}
            />
         case 'websites':
            return <ListSectionWrapper
                title="Websites & Links"
                description="Include links to your portfolio, LinkedIn, or GitHub."
                items={resume.websites || []}
                onAddItem={() => handleEdit({type: 'new_website'})}
                renderItem={(item) => (
                    <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.url}</CardDescription>
                    </CardHeader>
                )}
                onEditItem={(item) => handleEdit({type: 'websites', id: item.id})}
                onRemoveItem={(item) => removeItem('websites', item.id)}
            />
        case 'skills':
             return <SectionWrapper title="Skills" description="List your key skills, separated by commas.">
                 <CustomTextarea label="Skills" value={(resume.skills || []).join(', ')} onChange={e => handleUpdate(d => d.skills = e.target.value.split(',').map(s => s.trim()))} rows={5} />
            </SectionWrapper>
        case 'achievements':
             return <ListSectionWrapper
                title="Achievements"
                description="List any awards, honors, or significant achievements."
                items={(resume.achievements || []).map((ach, i) => ({id: i.toString(), content: ach}))}
                onAddItem={() => handleUpdate(d => d.achievements = [...(d.achievements || []), "New Achievement"])}
                renderItem={(item) => <CardHeader><CardTitle>{item.content}</CardTitle></CardHeader>}
                onEditItem={(_item) => {
                  handleEdit({type: 'achievements'});
                }}
                onRemoveItem={(item) => handleUpdate(d => d.achievements = (d.achievements || []).filter((_ach, i) => i.toString() !== item.id))}
                editAll
            />
        case 'hobbies':
            return <SectionWrapper title="Hobbies & Interests" description="List your hobbies, separated by commas.">
                 <CustomTextarea label="Hobbies" value={(resume.hobbies || []).join(', ')} onChange={e => handleUpdate(d => d.hobbies = e.target.value.split(',').map(s => s.trim()))} rows={4} />
            </SectionWrapper>
        case 'customSections':
             return <ListSectionWrapper
                title="Custom Sections"
                description="Add your own sections like 'Certifications' or 'Languages'."
                items={resume.customSections || []}
                onAddItem={() => handleEdit({type: 'new_customSection'})}
                renderItem={(item) => (
                   <>
                    <CardHeader>
                        <CardTitle>{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent><p className="whitespace-pre-wrap">{item.content}</p></CardContent>
                   </>
                )}
                onEditItem={(item) => handleEdit({type: 'customSections', id: item.id})}
                onRemoveItem={(item) => removeItem('customSections', item.id)}
            />
        default:
            return <div className="p-8">Please select a section to edit.</div>
    }
  }

  return (
     <div className="flex h-screen bg-muted/40 flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className="w-full md:w-72 border-b md:border-r md:border-b-0 border-border bg-background flex flex-col">
            <div className="p-4 border-b border-border">
                <Button variant="outline" size="sm" onClick={onBack} className="w-full">
                    <ChevronLeft className="mr-2" /> Back to Home
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <nav className="p-4 space-y-1">
                    {SECTIONS.map(section => (
                        <Button
                            key={section.id}
                            variant={activeSection === section.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon className="mr-2" />
                            {section.title}
                        </Button>
                    ))}
                </nav>
            </ScrollArea>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center justify-end p-2 border-b border-border bg-background shadow-sm h-16">
                 <div className="flex items-center gap-2">
                    <Button onClick={undo} disabled={!canUndo || editorDisabled} variant="outline" size="icon" aria-label="Undo">
                        <Undo />
                    </Button>
                    <Button onClick={redo} disabled={!canRedo || editorDisabled} variant="outline" size="icon" aria-label="Redo">
                        <Redo />
                    </Button>
                    <Button onClick={() => setIsPreviewOpen(true)} variant="outline" size="sm">
                        <View className="mr-2" /> Preview
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
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
                <div className="lg:col-span-2 overflow-y-auto">
                   <div className="p-6">
                     {renderSectionEditor(activeSection)}
                   </div>
                </div>
                {/* Right Tools Sidebar */}
                <aside className="lg:col-span-1 border-l border-border bg-background overflow-y-auto">
                   <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="p-4 font-semibold">AI Assistant</AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                <div className="space-y-4">
                                     <p className="text-sm text-muted-foreground">Ask the AI to improve your resume. Try things like "Make my summary more professional" or "Rewrite my last job to focus on leadership skills."</p>
                                    <Textarea
                                        placeholder="Your request..."
                                        value={chatQuery}
                                        onChange={(e) => setChatQuery(e.target.value)}
                                        rows={4}
                                        disabled={editorDisabled}
                                    />
                                    <Button onClick={handleChatEnhance} disabled={editorDisabled} className="w-full">
                                        {isChatEnhancing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        Enhance with AI
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="p-4 font-semibold">ATS Scorecard</AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Paste a job description to see how well your resume matches.</p>
                                    <Textarea
                                        placeholder="Paste job description here..."
                                        value={jobCriteria}
                                        onChange={(e) => setJobCriteria(e.target.value)}
                                        rows={8}
                                        disabled={editorDisabled}
                                    />
                                    <Button onClick={handleScoreResume} disabled={editorDisabled || !jobCriteria} className="w-full">
                                        {isScoring ? <Loader2 className="animate-spin" /> : <Award />}
                                        Get ATS Score
                                    </Button>
                                    {isScoring && <div className="text-center"><Loader2 className="animate-spin text-primary"/></div>}
                                    {atsResult && !isScoring && (
                                         <Card>
                                             <CardHeader className="items-center">
                                                 <ScoreCircle score={atsResult.score} />
                                                 <CardTitle>Score: {atsResult.score}/100</CardTitle>
                                             </CardHeader>
                                             <CardContent>
                                                <h4 className="font-semibold mb-2">Justification:</h4>
                                                <p className="text-sm whitespace-pre-wrap">{atsResult.justification}</p>
                                             </CardContent>
                                         </Card>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </aside>
            </div>
        </main>
       

        {/* Preview Modal */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl h-[90vh]">
                 <DialogHeader><DialogTitle>Resume Preview</DialogTitle></DialogHeader>
                 <ScrollArea className="h-full w-full">
                    <div className="p-4 bg-secondary rounded-lg flex justify-center">
                        <ResumePreview
                            resumeData={resume}
                            templateName={template}
                            isEditable={false} // Preview is not editable
                            className="w-full max-w-[8.5in]"
                        />
                    </div>
                 </ScrollArea>
                 <DialogFooter>
                    <div className="w-full flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <label className="text-sm font-medium">Template:</label>
                             <Select value={template} onValueChange={setTemplate}>
                                 <SelectTrigger className="w-48"><SelectValue placeholder="Change template" /></SelectTrigger>
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
                        </div>
                        <DialogClose asChild>
                            <Button>Close</Button>
                        </DialogClose>
                    </div>
                 </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Item Edit Modal */}
        {renderEditDialog()}
    </div>
  );
}

const SectionWrapper = ({ title, description, children }: { title: string, description: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const ListSectionWrapper = <T extends { id: string }>({ title, description, items, onAddItem, renderItem, onEditItem, onRemoveItem, editAll = false }: {
    title: string,
    description: string,
    items: T[],
    onAddItem: () => void,
    renderItem: (item: T) => React.ReactNode,
    onEditItem: (item: T) => void,
    onRemoveItem: (item: T) => void,
    editAll?: boolean
}) => (
    <div className="space-y-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                <p className="text-muted-foreground">{description}</p>
            </div>
            {editAll ? (
                 <Button variant="outline" onClick={() => onEditItem({} as T)}>
                    <Pencil className="mr-2" /> Edit All
                </Button>
            ) : (
                <Button onClick={onAddItem}>
                    <PlusCircle className="mr-2" /> Add New
                </Button>
            )}
        </div>
        <div className="space-y-4">
            {items.map(item => (
                <Card key={item.id}>
                    <div className="relative">
                        {renderItem(item)}
                        {!editAll && (
                            <div className="absolute top-4 right-4 flex gap-2">
                                <Button variant="outline" size="icon" onClick={() => onEditItem(item)}><Pencil className="h-4 w-4" /></Button>
                                <Button variant="destructive" size="icon" onClick={() => onRemoveItem(item)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        )}
                    </div>
                </Card>
            ))}
            {items.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No items added yet.</p>
                </div>
            )}
        </div>
    </div>
)


const ScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 40; // radius is 40
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative h-24 w-24">
        <svg className="transform -rotate-90" width="96" height="96" viewBox="0 0 100 100">
          <circle
            className="text-secondary"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary transition-all duration-1000 ease-out"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r="40"
            cx="50"
            cy="50"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
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
