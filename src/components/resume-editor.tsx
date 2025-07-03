
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
  Palette,
  Pencil,
  PlusCircle,
  PlusSquare,
  Redo,
  Smile,
  Sparkles,
  Trash2,
  Undo,
  User,
  Wrench,
  Eye,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ResumeData, ResumeDataWithIds } from "@/ai/resume-schema";
import { enhanceResumeWithReference, type AIFeedbackData } from "@/ai/flows/enhance-resume-with-reference";
import { chatEnhanceResume } from "@/ai/flows/chat-enhance-resume";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { ResumePreview } from "./resume-preview";
import { ScrollArea } from "./ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface ResumeEditorProps {
  initialResumeData: ResumeDataWithIds;
  onBack: () => void;
  template: string;
  color: string;
}

export type EditableSectionType = 'contact' | 'summary' | 'experience' | 'education' | 'websites' | 'projects' | 'skills' | 'achievements' | 'hobbies' | 'customSections' | 'new_experience' | 'new_education' | 'new_website' | 'new_project' | 'new_customSection';
export type RemovableSectionType = 'experience' | 'education' | 'websites' | 'projects' | 'customSections';
export type EditableSection = { type: EditableSectionType, id?: string };


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

const FONT_PAIRS = {
  "sans": { body: "'PT Sans', sans-serif", headline: "'Poppins', sans-serif" },
  "serif": { body: "'Georgia', serif", headline: "'Garamond', serif" },
  "modern": { body: "'Helvetica', sans-serif", headline: "'Futura', sans-serif" },
  "mono": { body: "'Courier New', monospace", headline: "'Courier New', monospace" },
}


export function ResumeEditor({ initialResumeData, onBack, template: initialTemplate, color: initialColor }: ResumeEditorProps) {
  const {
    state: resume,
    set: setResume,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<ResumeDataWithIds>(assignIdsToResume(initialResumeData));

  const [template, setTemplate] = useState(initialTemplate);
  const [themeColor, setThemeColor] = useState(initialColor);
  const [fontPair, setFontPair] = useState<keyof typeof FONT_PAIRS>("sans");

  const [isDownloading, setIsDownloading] = useState(false);
  const [isChatEnhancing, setIsChatEnhancing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { toast } = useToast();

  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  
  const [aiFeedback, setAiFeedback] = useState<AIFeedbackData | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [referenceDataUris, setReferenceDataUris] = useState<string[]>([]);


  const handleUpdate = (updater: (draft: ResumeDataWithIds) => void) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    updater(newResume);
    setResume(newResume);
  };

  const handleEdit = (section: EditableSection) => {
    let dataToEdit: any;

    switch (section.type) {
      case 'contact':
        dataToEdit = { 
            firstName: resume.firstName, 
            lastName: resume.lastName,
            profession: resume.profession, 
            email: resume.email, 
            phone: resume.phone, 
            location: resume.location,
            pinCode: resume.pinCode,
            linkedIn: resume.linkedIn,
            drivingLicense: resume.drivingLicense,
        };
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
        return;
    }

    if (typeof dataToEdit === 'undefined') {
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
      if (!editingSection) return;
      switch (editingSection.type) {
        case 'contact':
            draft.firstName = editFormData.firstName;
            draft.lastName = editFormData.lastName;
            draft.profession = editFormData.profession;
            draft.email = editFormData.email;
            draft.phone = editFormData.phone;
            draft.location = editFormData.location;
            draft.pinCode = editFormData.pinCode;
            draft.linkedIn = editFormData.linkedIn;
            draft.drivingLicense = editFormData.drivingLicense;
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

  const handleReferenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileList = Array.from(files);
      const validFiles = fileList.filter(file => {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                variant: "destructive",
                title: `File too large: ${file.name}`,
                description: "Please upload files smaller than 5MB.",
            });
            return false;
        }
        return true;
      });

      setReferenceFiles(prev => [...prev, ...validFiles]);
      
      const filePromises = validFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(newUris => {
        setReferenceDataUris(prev => [...prev, ...newUris]);
      }).catch(err => {
        console.error(err);
        toast({ variant: 'destructive', title: 'Error reading files' });
      });
    }
  };

  const clearReferenceFile = (fileName: string) => {
    const fileIndex = referenceFiles.findIndex(f => f.name === fileName);
    if(fileIndex === -1) return;

    setReferenceFiles(prev => prev.filter(f => f.name !== fileName));
    setReferenceDataUris(prev => {
        const newUris = [...prev];
        newUris.splice(fileIndex, 1);
        return newUris;
    });
  };

  const handleChatEnhance = async () => {
    if (!chatQuery.trim()) {
        toast({ title: "Please enter a request.", variant: "destructive" });
        return;
    }
    setIsChatEnhancing(true);
    setAiFeedback(null);
    try {
        let result: EnhanceResumeWithReferenceOutput;
        if (referenceDataUris.length > 0) {
            result = await enhanceResumeWithReference({
                resume,
                query: chatQuery,
                referenceDataUris: referenceDataUris,
            });
        } else {
            const simpleEnhanceResult = await chatEnhanceResume({ resume, query: chatQuery });
            result = {
                resume: simpleEnhanceResult,
                feedback: {
                    score: 0,
                    justification: "No reference document was provided for scoring, but the resume was updated based on your general request.",
                }
            }
        }
        
        const finalResume = assignIdsToResume(result.resume);
        setResume(finalResume);
        setAiFeedback(result.feedback);
        setChatQuery("");
        
        toast({ title: "AI Enhancement Complete!", description: "Your resume and feedback have been updated." });
    } catch (error) {
        console.error("Chat enhancement failed:", error);
        toast({ variant: "destructive", title: "Enhancement Failed", description: "The AI assistant could not process your request." });
    } finally {
        setIsChatEnhancing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    // The ref points to the main preview component in the editor, not the one in the dialog.
    const elementToCapture = previewRef.current?.querySelector('.preview-content-wrapper') || previewRef.current;

    if (!elementToCapture) {
        toast({ variant: "destructive", title: "Preview Not Found" });
        setIsDownloading(false);
        return;
    }

    try {
        const canvas = await html2canvas(elementToCapture as HTMLElement, {
            scale: 4, // Increase scale for higher resolution to fix quality and potential layout issues
            useCORS: true, 
            backgroundColor: '#ffffff', // Set a white background for the capture
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate the height of the image in the PDF, maintaining aspect ratio
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add the first page
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add more pages if the resume is longer than one page
        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        pdf.save(`${[resume.firstName, resume.lastName].join('_') || 'resume'}_${template}.pdf`);
    } catch (error) {
        console.error("PDF Download failed:", error);
        toast({ variant: "destructive", title: "Download Failed", description: "Could not generate PDF. Please try again." });
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    const fullName = [resume.firstName, resume.lastName].filter(Boolean).join(" ");
    try {
        const createTextRuns = (text: string) => text.split('\n').flatMap((line, i) => i > 0 ? [new TextRun({ break: 1 }), new TextRun(line)] : [new TextRun(line)]);
        const children: Paragraph[] = [
            new Paragraph({ text: fullName, heading: HeadingLevel.TITLE, alignment: 'center' }),
            ...(resume.profession ? [new Paragraph({ text: resume.profession, alignment: 'center' })] : []),
            new Paragraph({ text: [resume.email, resume.phone].filter(Boolean).join(" | "), alignment: 'center' }),
            ...(resume.websites && resume.websites.length > 0 ? [new Paragraph({ text: resume.websites.map(w => w.url).join(" | "), alignment: 'center' })] : []),
            new Paragraph(""),
        ];

        const addSection = (title: string, body: () => void) => {
            children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } } }));
            body();
            children.push(new Paragraph(""));
        };

        if (resume.summary) addSection('Summary', () => { children.push(new Paragraph({ children: createTextRuns(resume.summary)})); });
        if (resume.experience.length > 0) addSection('Experience', () => resume.experience.forEach(exp => {
            children.push(new Paragraph({ children: [new TextRun({ text: exp.title, bold: true }), new TextRun({text: ` at ${exp.company}`, bold: true})]}));
            children.push(new Paragraph({ children: [new TextRun({ text: `${exp.location} | ${exp.dates}`, italics: true })]}));
            exp.responsibilities.forEach(resp => children.push(new Paragraph({ text: resp, bullet: { level: 0 } })));
            children.push(new Paragraph(""));
        }));
        if (resume.projects && resume.projects.length > 0) addSection('Projects', () => resume.projects.forEach(proj => {
            children.push(new Paragraph({ children: [new TextRun({ text: proj.name, bold: true })]}));
            if(proj.url) children.push(new Paragraph({ text: proj.url, style: "Hyperlink" }));
            children.push(new Paragraph({ children: createTextRuns(proj.description)}));
            children.push(new Paragraph({ children: [new TextRun({text: 'Technologies: ', bold: true}), new TextRun(proj.technologies.join(", "))]}));
            children.push(new Paragraph(""));
        }));
        if (resume.education.length > 0) addSection('Education', () => resume.education.forEach(edu => {
            children.push(new Paragraph({ children: [new TextRun({ text: `${edu.degree}, ${edu.school}`, bold: true })]}));
            children.push(new Paragraph({ children: [new TextRun({ text: `${edu.location} | ${edu.dates}`, italics: true })]}));
            children.push(new Paragraph(""));
        }));
        if (resume.customSections && resume.customSections.length > 0) resume.customSections.forEach(sec => addSection(sec.title, () => {
            children.push(new Paragraph({ children: createTextRuns(sec.content) }));
        }));
        if (resume.skills.length > 0) addSection('Skills', () => { children.push(new Paragraph(resume.skills.join(", "))); });
        if (resume.achievements && resume.achievements.length > 0) addSection('Achievements', () => resume.achievements.forEach(ach => children.push(new Paragraph({ text: ach, bullet: { level: 0 } }))));
        if (resume.hobbies && resume.hobbies.length > 0) addSection('Hobbies & Interests', () => { children.push(new Paragraph(resume.hobbies.join(", "))); });

        const doc = new Document({ styles: { paragraph: { run: { font: "PT Sans", size: 22 } }, heading1: { run: { font: "Poppins", size: 28, bold: true }, paragraph: { spacing: { after: 120 } } }, title: { run: { font: "Poppins", size: 44, bold: true }, paragraph: { spacing: { after: 120 } } }, }, sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fullName.replace(/\s+/g, "_") || "resume"}_resume.docx`);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Download Failed", description: "Error generating DOCX." });
    } finally {
      setIsDownloading(false);
    }
  };

  const editorDisabled = isDownloading || isChatEnhancing;
  
  const removeItem = (type: RemovableSectionType, id: string) => {
    handleUpdate(draft => {
      const prop = type as keyof ResumeDataWithIds;
      if (Array.isArray((draft as any)[prop])) {
        (draft as any)[prop] = (draft as any)[prop].filter((item: any) => item.id !== id);
      }
    });
  }

  const renderEditDialog = () => {
    if (!editingSection || !editFormData) return null;
    let title = "Edit Section";
    let content = null;
    const type = editingSection.type;

    if (type === 'contact' || type === 'summary' || type.startsWith('new_') || 
        type === 'experience' || type === 'education' || type === 'projects' || 
        type === 'websites' || type === 'customSections' || type === 'skills' || 
        type === 'achievements' || type === 'hobbies') {
        
        const isNew = type.startsWith('new_');
        const baseType = isNew ? type.substring(4) : type;

        switch(baseType) {
            case 'contact':
                title = "Edit Contact Information"
                content = (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <CustomInput label="First Name" value={editFormData.firstName} onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})} />
                            <CustomInput label="Last Name" value={editFormData.lastName} onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})} />
                        </div>
                        <CustomInput label="Profession" value={editFormData.profession ?? ''} onChange={(e) => setEditFormData({...editFormData, profession: e.target.value})} placeholder="e.g. Software Engineer" />
                        <div className="grid grid-cols-2 gap-4">
                            <CustomInput label="Email Address" type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
                            <CustomInput label="Phone Number" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <CustomInput label="Location (e.g. City, Country)" value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
                            <CustomInput label="PIN Code" value={editFormData.pinCode ?? ''} onChange={(e) => setEditFormData({...editFormData, pinCode: e.target.value})} />
                        </div>
                         <CustomInput label="LinkedIn Profile URL" value={editFormData.linkedIn ?? ''} onChange={(e) => setEditFormData({...editFormData, linkedIn: e.target.value})} />
                    </div>
                );
                break;
            case 'summary':
                title = "Edit Professional Summary"
                content = <CustomTextarea label="Summary" value={editFormData.summary} onChange={(e) => setEditFormData({summary: e.target.value})} rows={6} />;
                break;
            case 'experience':
                title = isNew ? "Add Experience" : "Edit Experience";
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
            case 'education':
                 title = isNew ? "Add Education" : "Edit Education";
                 content = (
                    <div className="space-y-4">
                        <CustomInput label="Degree / Certificate" value={editFormData.degree} onChange={e => setEditFormData({...editFormData, degree: e.target.value})} />
                        <CustomInput label="School / Institution" value={editFormData.school} onChange={e => setEditFormData({...editFormData, school: e.target.value})} />
                        <CustomInput label="Location" value={editFormData.location} onChange={e => setEditFormData({...editFormData, location: e.target.value})} />
                        <CustomInput label="Dates" value={editFormData.dates} onChange={e => setEditFormData({...editFormData, dates: e.target.value})} />
                    </div>
                 );
                 break;
            case 'project': // Note: Plural in type, singular here
                title = isNew ? "Add Project" : "Edit Project";
                content = (
                    <div className="space-y-4">
                        <CustomInput label="Project Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                        <CustomInput label="Project URL" value={editFormData.url ?? ""} onChange={e => setEditFormData({...editFormData, url: e.target.value})} />
                        <CustomTextarea label="Description" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} rows={4} />
                        <CustomInput label="Technologies (comma-separated)" value={(editFormData.technologies || []).join(", ")} onChange={e => setEditFormData({...editFormData, technologies: e.target.value.split(',').map(t => t.trim())})} />
                    </div>
                )
                break;
            case 'website':
                 title = isNew ? "Add Website/Link" : "Edit Website/Link";
                 content = (
                    <div className="space-y-4">
                        <CustomInput label="Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} placeholder="e.g. LinkedIn, GitHub Portfolio" />
                        <CustomInput label="URL" value={editFormData.url} onChange={e => setEditFormData({...editFormData, url: e.target.value})} />
                    </div>
                 );
                 break;
            case 'customSection':
                title = isNew ? "Add Custom Section" : "Edit Custom Section";
                content = (
                    <div className="space-y-4">
                        <CustomInput label="Section Title" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
                        <CustomTextarea label="Content" value={editFormData.content} onChange={e => setEditFormData({...editFormData, content: e.target.value})} rows={6} />
                    </div>
                );
                break;
            case 'skills':
                title = "Edit Skills";
                content = <CustomTextarea label="Skills (comma-separated)" value={(editFormData || []).join(', ')} onChange={(e) => setEditFormData(e.target.value.split(',').map(s => s.trim()))} rows={4} placeholder="e.g. React, TypeScript..." />;
                break;
            case 'achievements':
                title = "Edit Achievements";
                content = (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">Achievements</label>
                        {(editFormData || []).map((ach: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                                <Textarea value={ach} onChange={(e) => setEditFormData(editFormData.map((a:string, i:number) => i === index ? e.target.value : a))} rows={2}/>
                                <Button variant="ghost" size="icon" onClick={() => setEditFormData(editFormData.filter((_:any, i:number) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setEditFormData([...(editFormData || []), ""])}><PlusCircle className="mr-2 h-4 w-4"/> Add Achievement</Button>
                    </div>
                );
                break;
            case 'hobbies':
                title = "Edit Hobbies & Interests";
                content = <CustomTextarea label="Hobbies (comma-separated)" value={(editFormData || []).join(', ')} onChange={(e) => setEditFormData(e.target.value.split(',').map(s => s.trim()))} rows={4} placeholder="e.g. Hiking, Reading..." />;
                break;
        }
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

  return (
     <div className="flex h-screen bg-muted/40 flex-col md:flex-row">
        {/* Left Sidebar */}
        <aside className={cn(
          "border-b md:border-r md:border-b-0 border-border bg-background flex flex-col transition-all duration-300",
          isSidebarOpen ? "w-full md:w-80" : "w-full md:w-[72px]"
        )}>
            <div className="p-4 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                    <Button onClick={() => setIsSidebarOpen(!isSidebarOpen)} variant="ghost" size="icon" className="hidden md:flex">
                        {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                        <span className="sr-only">Toggle AI Panel</span>
                    </Button>
                    <Button variant="outline" size={isSidebarOpen ? "sm" : "icon"} onClick={onBack}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className={cn("ml-2", !isSidebarOpen && "hidden")}>Back</span>
                    </Button>
                </div>

                <div className={cn("flex items-center gap-1", !isSidebarOpen && "hidden")}>
                    <Button onClick={undo} disabled={!canUndo || editorDisabled} variant="ghost" size="icon" aria-label="Undo"><Undo className="h-4 w-4" /></Button>
                    <Button onClick={redo} disabled={!canRedo || editorDisabled} variant="ghost" size="icon" aria-label="Redo"><Redo className="h-4 w-4" /></Button>
                    <Button onClick={() => setIsPreviewOpen(true)} variant="ghost" size="icon" aria-label="Preview"><Eye className="h-4 w-4"/></Button>
                </div>
            </div>
            
            <div className={cn("flex-1 overflow-hidden", !isSidebarOpen && "hidden")}>
                <Accordion type="multiple" className="w-full flex-1 flex flex-col" defaultValue={['ai-assistant', 'ai-feedback']}>
                    <ScrollArea className="flex-1">
                        <AccordionItem value="ai-assistant">
                            <AccordionTrigger className="p-4 font-semibold text-base">AI Assistant</AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Ask the AI to improve your resume. Attach job descriptions or other files for tailored suggestions.</p>
                                    <Textarea placeholder="e.g., 'Tailor my summary for this job.'" value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} rows={3} disabled={editorDisabled} />
                                    
                                    <div className="space-y-2">
                                        <label htmlFor="reference-upload" className="text-sm font-medium text-foreground cursor-pointer hover:text-primary">
                                            Attach References (Optional)
                                        </label>
                                        <Input id="reference-upload" type="file" className="sr-only" onChange={handleReferenceFileChange} disabled={editorDisabled} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" multiple />
                                        {referenceFiles.length > 0 && (
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <ul className="space-y-1">
                                                    {referenceFiles.map(f => (
                                                      <li key={f.name} className="flex items-center justify-between bg-muted p-1 rounded">
                                                        <span className="truncate pr-2">{f.name}</span>
                                                        <Button variant="ghost" size="icon" onClick={() => clearReferenceFile(f.name)} disabled={editorDisabled} aria-label="Clear reference file" className="h-5 w-5"><Trash2 className="h-3 w-3"/></Button>
                                                      </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <Button onClick={handleChatEnhance} disabled={editorDisabled || !chatQuery} className="w-full">
                                        {isChatEnhancing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        Enhance with AI
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="ai-feedback" className="border-b-0">
                            <AccordionTrigger className="p-4 font-semibold text-base">AI Analysis</AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                                {isChatEnhancing && (
                                    <div className="flex flex-col items-center justify-center gap-4 p-8">
                                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        <p className="text-muted-foreground">AI is analyzing...</p>
                                    </div>
                                )}
                                {!isChatEnhancing && !aiFeedback && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Use the AI Assistant above to get feedback.
                                    </p>
                                )}
                                {aiFeedback && !isChatEnhancing && (
                                     <Card>
                                         <CardHeader className="items-center">
                                             <ScoreCircle score={aiFeedback.score} />
                                             <CardTitle>ATS Score: {aiFeedback.score}/100</CardTitle>
                                         </CardHeader>
                                         <CardContent className="text-sm space-y-4">
                                            <div>
                                                <h4 className="font-semibold mb-1">Justification:</h4>
                                                <p className="text-muted-foreground whitespace-pre-wrap">{aiFeedback.justification}</p>
                                            </div>
                                            {aiFeedback.skillsToLearn && aiFeedback.skillsToLearn.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold mb-2">Suggested Skills to Learn:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {aiFeedback.skillsToLearn.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                                                    </div>
                                                </div>
                                            )}
                                             {aiFeedback.suggestedRoles && aiFeedback.suggestedRoles.length > 0 && (
                                                <div>
                                                    <h4 className="font-semibold mb-2">Other Suggested Roles:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {aiFeedback.suggestedRoles.map(role => <Badge key={role} variant="outline">{role}</Badge>)}
                                                    </div>
                                                </div>
                                            )}
                                         </CardContent>
                                     </Card>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </ScrollArea>
                </Accordion>
            </div>
        </aside>
        
        {/* Main Content: Interactive Preview */}
        <main className="flex-1 bg-muted/20 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-border bg-background flex-wrap flex items-center justify-center gap-4">
                 <div className="space-y-1">
                     <label className="text-xs font-medium">Template</label>
                     <Select value={template} onValueChange={setTemplate}>
                         <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="professional">Professional</SelectItem>
                             <SelectItem value="modern">Modern</SelectItem>
                             <SelectItem value="classic">Classic</SelectItem>
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
                <div className="space-y-1">
                    <label className="text-xs font-medium">Fonts</label>
                    <Select value={fontPair} onValueChange={(v) => setFontPair(v as keyof typeof FONT_PAIRS)}>
                        <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sans">Modern Sans</SelectItem>
                            <SelectItem value="serif">Classic Serif</SelectItem>
                            <SelectItem value="modern">Futuristic</SelectItem>
                            <SelectItem value="mono">Technical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1">
                    <label htmlFor="theme-color-picker" className="text-xs font-medium flex items-center gap-2">Theme Color</label>
                    <Input id="theme-color-picker" type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-24 h-9 p-1"/>
                </div>
                 <div className="flex items-end h-full">
                    <Button variant="outline" onClick={() => handleEdit({type: 'new_experience'})}>Add Experience</Button>
                 </div>
                 <div className="flex items-end h-full">
                    <Button variant="outline" onClick={() => handleEdit({type: 'new_education'})}>Add Education</Button>
                 </div>
                 <div className="flex items-end h-full">
                    <Button variant="outline" onClick={() => handleEdit({type: 'new_customSection'})}>Add Section</Button>
                 </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 md:p-8 flex justify-center">
                    <ResumePreview
                        ref={previewRef}
                        resumeData={resume}
                        templateName={template}
                        isEditable={true}
                        onEdit={handleEdit}
                        onRemove={removeItem}
                        className="w-full max-w-[8.5in] bg-white shadow-lg"
                        style={{
                            "--theme-color": themeColor,
                            "--font-family-body": FONT_PAIRS[fontPair].body,
                            "--font-family-headline": FONT_PAIRS[fontPair].headline,
                        } as React.CSSProperties}
                    />
                </div>
            </ScrollArea>
        </main>
       
        {/* Item Edit Modal */}
        {renderEditDialog()}

        {/* Full Page Preview and Download Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Resume Preview</DialogTitle>
                    <DialogDescription>This is how your resume will look. Use the download buttons below.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto bg-muted/40 p-4">
                    <ResumePreview
                        resumeData={resume}
                        templateName={template}
                        className="w-full max-w-[8.5in] mx-auto bg-white shadow-lg"
                        style={{
                            "--theme-color": themeColor,
                            "--font-family-body": FONT_PAIRS[fontPair].body,
                            "--font-family-headline": FONT_PAIRS[fontPair].headline,
                        } as React.CSSProperties}
                    />
                </div>
                <DialogFooter className="pt-4">
                    <DialogClose asChild><Button variant="ghost">Close</Button></DialogClose>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="lg" disabled={isDownloading}>
                                {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
                                <span className="ml-2">Download Resume</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuItem onClick={handleDownloadPdf}>PDF (Visual Copy)</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDownloadDocx}>DOCX (Editable Text)</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

const ScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 40; // radius is 40
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="relative h-24 w-24">
        <svg className="transform -rotate-90" width="96" height="96" viewBox="0 0 100 100">
          <circle className="text-secondary" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
          <circle
            className="text-primary transition-all duration-1000 ease-out"
            strokeWidth="10" stroke="currentColor" fill="transparent"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            r="40" cx="50" cy="50" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
          {score}
        </span>
      </div>
    );
};

const CustomInput = React.forwardRef<HTMLInputElement, {label?:string} & React.ComponentProps<typeof Input>>(({ className, type, label, ...props }, ref) => {
    const id = React.useId();
    if (!label) return <Input type={type} className={className} ref={ref} {...props}/>
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
    if (!label) return <Textarea className={className} ref={ref} {...props} />
    return (
      <div className="grid w-full gap-1.5">
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
        <Textarea id={id} className={className} ref={ref} {...props} />
      </div>
    )
});
CustomTextarea.displayName = "Textarea";
