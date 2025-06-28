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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { ResumeData, ResumeDataWithIds, ExperienceWithId, EducationWithId, WebsiteWithId, ProjectWithId } from "@/ai/flows/create-resume";
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
import { Card } from "./ui/card";

interface ResumeEditorProps {
  initialResumeData: ResumeDataWithIds;
  onBack: () => void;
}

// Helper for deep cloning without IDs for the API
const stripIds = (resume: ResumeDataWithIds): ResumeData => {
    const { experience, education, projects, websites, ...rest } = resume;
    return {
        ...rest,
        experience: experience.map(({ id, ...exp }) => exp),
        education: education.map(({ id, ...edu }) => edu),
        projects: (projects || []).map(({ id, ...proj }) => proj),
        websites: (websites || []).map(({ id, ...site }) => site),
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
  | { type: 'new_experience' }
  | { type: 'new_education' }
  | { type: 'new_website' }
  | { type: 'new_project' };


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
    let dataToEdit = null;
    if ('id' in section) {
      const sectionKey = (section.type + 's') as 'experiences' | 'educations' | 'websites' | 'projects';
      dataToEdit = (resume[sectionKey] as any[])?.find(item => item.id === section.id);
    } else if (section.type === 'contact') {
        dataToEdit = { name: resume.name, email: resume.email, phone: resume.phone }
    } else if (section.type === 'summary') {
        dataToEdit = { summary: resume.summary };
    } else {
        // For simple arrays or new items
        dataToEdit = resume[section.type as keyof typeof resume];
    }
    setEditFormData(JSON.parse(JSON.stringify(dataToEdit))); // Deep copy
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
        case 'experience':
        case 'education':
        case 'websites':
        case 'projects':
            const keyWithS = (editingSection.type + 's') as 'experiences' | 'educations' | 'websites' | 'projects';
            const index = draft[keyWithS].findIndex(item => item.id === editingSection.id);
            if (index > -1) draft[keyWithS][index] = editFormData;
            break;
        case 'new_experience':
            draft.experience.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'new_education':
            draft.education.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'new_website':
            draft.websites.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        case 'new_project':
            draft.projects.push({ ...editFormData, id: crypto.randomUUID() });
            break;
        // Simple arrays, just replace them
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
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`${resume.name.replace(/\s+/g, "_") || "resume"}_resume.pdf`);
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
  
  const removeItem = (type: 'experience' | 'education' | 'websites' | 'projects', id: string) => {
    handleUpdate(draft => {
      const key = (type + 's') as 'experiences' | 'educations' | 'websites' | 'projects';
      (draft[key] as any[]) = (draft[key] as any[]).filter(item => item.id !== id);
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
                    <Input label="Name" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                    <Input label="Email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
                    <Input label="Phone" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
                </div>
            );
            break;
        case 'summary':
            title = "Edit Summary"
            content = <Textarea value={editFormData.summary} onChange={(e) => setEditFormData({summary: e.target.value})} rows={6} />;
            break;
        case 'new_experience':
        case 'experience':
            title = editingSection.type === 'new_experience' ? "Add Experience" : "Edit Experience";
            content = (
                <div className="space-y-4">
                    <Input label="Title" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} />
                    <Input label="Company" value={editFormData.company} onChange={(e) => setEditFormData({...editFormData, company: e.target.value})} />
                    <Input label="Location" value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
                    <Input label="Dates" value={editFormData.dates} onChange={(e) => setEditFormData({...editFormData, dates: e.target.value})} />
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
        // Add other cases for education, projects, etc.
        case 'new_education':
        case 'education':
             title = editingSection.type === 'new_education' ? "Add Education" : "Edit Education";
             content = (
                <div className="space-y-4">
                    <Input label="Degree" value={editFormData.degree} onChange={e => setEditFormData({...editFormData, degree: e.target.value})} />
                    <Input label="School" value={editFormData.school} onChange={e => setEditFormData({...editFormData, school: e.target.value})} />
                    <Input label="Location" value={editFormData.location} onChange={e => setEditFormData({...editFormData, location: e.target.value})} />
                    <Input label="Dates" value={editFormData.dates} onChange={e => setEditFormData({...editFormData, dates: e.target.value})} />
                </div>
             );
             break;
        case 'new_project':
        case 'projects':
            title = editingSection.type === 'new_project' ? "Add Project" : "Edit Project";
            content = (
                <div className="space-y-4">
                    <Input label="Project Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                    <Input label="Project URL" value={editFormData.url} onChange={e => setEditFormData({...editFormData, url: e.target.value})} />
                    <Textarea label="Description" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} rows={4} />
                    <Input label="Technologies (comma-separated)" value={(editFormData.technologies || []).join(", ")} onChange={e => setEditFormData({...editFormData, technologies: e.target.value.split(',').map(t => t.trim())})} />
                </div>
            )
            break;
        case 'new_website':
        case 'websites':
             title = editingSection.type === 'new_website' ? "Add Website" : "Edit Website";
             content = (
                <div className="space-y-4">
                    <Input label="Name" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} placeholder="e.g. LinkedIn, GitHub" />
                    <Input label="URL" value={editFormData.url} onChange={e => setEditFormData({...editFormData, url: e.target.value})} />
                </div>
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

  // Extend Input to have a label prop
  const InputWithLabel = ({label, ...props}: {label: string} & React.ComponentProps<typeof Input>) => (
    <div>
        <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
        <Input {...props} />
    </div>
  )
  // Extend Textarea to have a label prop
  const TextareaWithLabel = ({label, ...props}: {label: string} & React.ComponentProps<typeof Textarea>) => (
    <div>
        <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
        <Textarea {...props} />
    </div>
  )


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
const Input = React.forwardRef<HTMLInputElement, {label?:string} & React.ComponentProps<"input">>(({ className, type, label, ...props }, ref) => {
    const id = React.useId();
    if (!label) {
        return <input type={type} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)} ref={ref} {...props}/>
    }
    return (
        <div className="grid w-full items-center gap-1.5">
            <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
            <input id={id} type={type} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)} ref={ref} {...props} />
        </div>
    );
});
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, {label?: string} & React.ComponentProps<"textarea">>(({ className, label, ...props }, ref) => {
    const id = React.useId();
    if (!label) {
        return <textarea className={cn('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm', className)} ref={ref} {...props} />
    }
    return (
      <div className="grid w-full gap-1.5">
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
        <textarea id={id} className={cn('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm', className)} ref={ref} {...props} />
      </div>
    )
});
Textarea.displayName = "Textarea";
