"use client";

import React, { useRef, useState } from "react";
import {
  ChevronLeft,
  Download,
  Globe,
  Loader2,
  BookOpen,
  PlusCircle,
  Redo,
  Sparkles,
  Trash2,
  Undo,
  Trophy,
  Heart
} from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { ResumeData, ResumeDataWithIds } from "@/ai/flows/create-resume";
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
import { ResumePreview } from "./resume-preview";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";

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
        projects: projects.map(({ id, ...proj }) => proj),
        websites: websites.map(({ id, ...site }) => site),
    };
};

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

  const handleUpdate = (updater: (draft: ResumeDataWithIds) => void) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    updater(newResume);
    setResume(newResume);
  };
  
  type SectionWithId = "experience" | "education" | "websites" | "projects";
  type SectionSimple = "skills" | "achievements" | "hobbies";

  const addSectionItem = (section: SectionWithId | SectionSimple) => {
    handleUpdate((draft) => {
      switch (section) {
        case "experience":
          draft.experience.push({ id: crypto.randomUUID(), title: "", company: "", location: "", dates: "", responsibilities: [""] });
          break;
        case "education":
          draft.education.push({ id: crypto.randomUUID(), degree: "", school: "", location: "", dates: "" });
          break;
        case "websites":
          draft.websites.push({ id: crypto.randomUUID(), name: "", url: "" });
          break;
        case "projects":
          draft.projects.push({ id: crypto.randomUUID(), name: "", description: "", technologies: [], url: "" });
          break;
        case "skills":
          draft.skills.push("");
          break;
        case "achievements":
          if (!draft.achievements) draft.achievements = [];
          draft.achievements.push("");
          break;
        case "hobbies":
           if (!draft.hobbies) draft.hobbies = [];
           draft.hobbies.push("");
          break;
      }
    });
  };

  const removeSectionItem = (section: SectionWithId | SectionSimple, index: number) => {
    handleUpdate((draft) => {
       (draft[section] as any[]).splice(index, 1);
    });
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const resumeForApi = stripIds(resume);
      const enhancedData = await enhanceResume(resumeForApi);

      // Re-add IDs for the client-side state
      const enhancedDataWithIds: ResumeDataWithIds = {
        ...enhancedData,
        experience: enhancedData.experience.map((exp, index) => ({
          ...exp,
          id: resume.experience[index]?.id || crypto.randomUUID(),
        })),
        education: enhancedData.education.map((edu, index) => ({
          ...edu,
          id: resume.education[index]?.id || crypto.randomUUID(),
        })),
        websites: (enhancedData.websites || []).map((site, index) => ({
            ...site,
            id: resume.websites[index]?.id || crypto.randomUUID(),
        })),
        projects: (enhancedData.projects || []).map((proj, index) => ({
            ...proj,
            id: resume.projects[index]?.id || crypto.randomUUID(),
        })),
        skills: enhancedData.skills || [],
        achievements: enhancedData.achievements || [],
        hobbies: enhancedData.hobbies || [],
      };

      setResume(enhancedDataWithIds);

      toast({
        title: "Resume Enhanced!",
        description: "Your resume has been improved by AI.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Enhancement Failed",
        description: "There was an error enhancing your resume.",
      });
    } finally {
      setIsEnhancing(false);
    }
  };


  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${resume.name.replace(/\s+/g, "_") || "resume"}_resume.pdf`);
    } catch (error) {
      console.error("PDF Download failed:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "There was an error generating the PDF.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    try {
      const children: Paragraph[] = [];
      
      children.push(new Paragraph({ text: resume.name, heading: HeadingLevel.TITLE }));
      const contactParts = [resume.email, resume.phone];
      children.push(new Paragraph({ text: contactParts.join(" | ") }));
      
      if (resume.websites && resume.websites.length > 0) {
        children.push(new Paragraph({ text: resume.websites.map(w => w.url).join(" | ") }));
      }
      children.push(new Paragraph(""));

      children.push(new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph(resume.summary));
      children.push(new Paragraph(""));

      children.push(new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_1 }));
      (resume.experience || []).forEach(exp => {
        children.push(new Paragraph({ children: [new TextRun({ text: exp.title, bold: true }), new TextRun({ text: `, ${exp.company}` })]}));
        children.push(new Paragraph({ children: [new TextRun({ text: `${exp.location} | ${exp.dates}`, italics: true })]}));
        (exp.responsibilities || []).forEach(resp => children.push(new Paragraph({ text: resp, bullet: { level: 0 } })));
        children.push(new Paragraph(""));
      });
      
      if (resume.projects && resume.projects.length > 0) {
        children.push(new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_1 }));
        resume.projects.forEach(proj => {
          children.push(new Paragraph({ children: [new TextRun({ text: proj.name, bold: true })]}));
          if (proj.url) children.push(new Paragraph({ text: proj.url, style: "Hyperlink" }));
          children.push(new Paragraph(proj.description));
          children.push(new Paragraph({ text: `Technologies: ${(proj.technologies || []).join(", ")}`, style: "IntenseQuote"}));
          children.push(new Paragraph(""));
        });
      }

      children.push(new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_1 }));
      (resume.education || []).forEach(edu => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${edu.degree}, ${edu.school}`, bold: true })]}));
        children.push(new Paragraph({ children: [new TextRun({ text: `${edu.location} | ${edu.dates}`, italics: true })]}));
        children.push(new Paragraph(""));
      });

      children.push(new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph((resume.skills || []).join(", ")));
      children.push(new Paragraph(""));

      if (resume.achievements && resume.achievements.length > 0) {
         children.push(new Paragraph({ text: "Achievements", heading: HeadingLevel.HEADING_1 }));
         resume.achievements.forEach(ach => children.push(new Paragraph({ text: ach || '', bullet: { level: 0 } })));
         children.push(new Paragraph(""));
      }
      
      if (resume.hobbies && resume.hobbies.length > 0) {
        children.push(new Paragraph({ text: "Hobbies & Interests", heading: HeadingLevel.HEADING_1 }));
        children.push(new Paragraph((resume.hobbies || []).join(", ")));
      }

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${resume.name.replace(/\s+/g, "_") || "resume"}_resume.docx`);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "There was an error generating the DOCX file.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const editorDisabled = isDownloading || isEnhancing;

  return (
     <div className="flex h-screen bg-background">
      {/* Editor Column */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-border">
            <Button variant="ghost" onClick={onBack} className="hidden sm:flex">
                <ChevronLeft className="mr-2" /> Back to Home
            </Button>
            <div className="flex items-center gap-2">
                <Button onClick={undo} disabled={!canUndo || editorDisabled} variant="outline" size="icon">
                  <Undo className="h-4 w-4" />
                  <span className="sr-only">Undo</span>
                </Button>
                <Button onClick={redo} disabled={!canRedo || editorDisabled} variant="outline" size="icon">
                  <Redo className="h-4 w-4" />
                  <span className="sr-only">Redo</span>
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleEnhance} disabled={editorDisabled} variant="outline" size="sm">
                  {isEnhancing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  <span className="hidden sm:inline ml-2">Enhance</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="sm" disabled={editorDisabled}>
                      <Download />
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

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-8 space-y-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input disabled={editorDisabled} value={resume.name} onChange={(e) => handleUpdate((d) => {d.name = e.target.value})} placeholder="Your Name" />
                    <Input disabled={editorDisabled} value={resume.email} onChange={(e) => handleUpdate((d) => {d.email = e.target.value})} placeholder="your.email@example.com" />
                    <Input disabled={editorDisabled} value={resume.phone} onChange={(e) => handleUpdate((d) => {d.phone = e.target.value})} placeholder="Your Phone" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                <CardContent>
                    <Textarea disabled={editorDisabled} value={resume.summary} onChange={(e) => handleUpdate((d) => {d.summary = e.target.value})} placeholder="A brief professional summary..." rows={5}/>
                </CardContent>
            </Card>

             {/* Websites */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><Globe/>Websites & Profiles</h2>
                    <Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem("websites")}><PlusCircle className="mr-2 h-4 w-4" /> Add Website</Button>
                </div>
                <div className="space-y-4">
                    {resume.websites.map((site, index) => (
                    <Card key={site.id}>
                        <CardContent className="p-4 flex gap-2">
                           <Input disabled={editorDisabled} value={site.name} onChange={(e) => handleUpdate(d => {d.websites[index].name = e.target.value})} placeholder="Website Name (e.g., GitHub)"/>
                           <Input disabled={editorDisabled} value={site.url} onChange={(e) => handleUpdate(d => {d.websites[index].url = e.target.value})} placeholder="URL (e.g., https://...)"/>
                           <Button disabled={editorDisabled} variant="ghost" size="icon" onClick={() => removeSectionItem("websites", index)}><Trash2/></Button>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Experience */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Experience</h2>
                    <Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem("experience")}><PlusCircle className="mr-2 h-4 w-4" /> Add Experience</Button>
                </div>
                <div className="space-y-4">
                    {resume.experience.map((exp, expIndex) => (
                    <Card key={exp.id}>
                        <CardContent className="p-4 space-y-2">
                             <Input disabled={editorDisabled} value={exp.title} onChange={(e) => handleUpdate((d) => (d.experience[expIndex].title = e.target.value))} placeholder="Job Title" className="font-bold"/>
                             <Input disabled={editorDisabled} value={exp.company} onChange={(e) => handleUpdate((d) => (d.experience[expIndex].company = e.target.value))} placeholder="Company"/>
                             <div className="flex gap-2">
                                <Input disabled={editorDisabled} value={exp.location} onChange={(e) => handleUpdate((d) => (d.experience[expIndex].location = e.target.value))} placeholder="Location"/>
                                <Input disabled={editorDisabled} value={exp.dates} onChange={(e) => handleUpdate((d) => (d.experience[expIndex].dates = e.target.value))} placeholder="Dates (e.g., Jan 2020 - Present)"/>
                             </div>
                             <ul className="space-y-2 pt-2">
                                {exp.responsibilities.map((resp, respIndex) => (
                                    <li key={respIndex} className="flex items-center gap-2">
                                        <Textarea disabled={editorDisabled} value={resp} onChange={(e) => handleUpdate((d) => (d.experience[expIndex].responsibilities[respIndex] = e.target.value))} className="w-full" placeholder="Responsibility or achievement" rows={2}/>
                                        <Button disabled={editorDisabled} variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleUpdate(d => d.experience[expIndex].responsibilities.splice(respIndex, 1))}><Trash2 className="h-4 w-4" /></Button>
                                    </li>
                                ))}
                             </ul>
                            <Button disabled={editorDisabled} variant="outline" size="sm" onClick={() => handleUpdate(d => d.experience[expIndex].responsibilities.push(""))}><PlusCircle className="mr-2 h-4 w-4" /> Add Responsibility</Button>
                        </CardContent>
                         <CardFooter className="flex justify-end p-2 border-t"><Button disabled={editorDisabled} variant="ghost" size="sm" onClick={() => removeSectionItem("experience", expIndex)}><Trash2 className="mr-2"/>Delete Section</Button></CardFooter>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Projects */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><BookOpen />Projects</h2>
                    <Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem("projects")}><PlusCircle className="mr-2 h-4 w-4" /> Add Project</Button>
                </div>
                <div className="space-y-4">
                    {resume.projects.map((proj, index) => (
                    <Card key={proj.id}>
                        <CardContent className="p-4 space-y-2">
                           <Input disabled={editorDisabled} value={proj.name} onChange={(e) => handleUpdate(d => {d.projects[index].name = e.target.value})} placeholder="Project Name" className="font-bold"/>
                           <Input disabled={editorDisabled} value={proj.url || ""} onChange={(e) => handleUpdate(d => {d.projects[index].url = e.target.value})} placeholder="Project URL"/>
                           <Textarea disabled={editorDisabled} value={proj.description} onChange={(e) => handleUpdate(d => {d.projects[index].description = e.target.value})} placeholder="Project Description" rows={3}/>
                           <Input disabled={editorDisabled} value={proj.technologies.join(", ")} onChange={(e) => handleUpdate(d => {d.projects[index].technologies = e.target.value.split(",").map(t => t.trim())})} placeholder="Technologies (comma-separated)"/>
                        </CardContent>
                        <CardFooter className="flex justify-end p-2 border-t"><Button disabled={editorDisabled} variant="ghost" size="sm" onClick={() => removeSectionItem("projects", index)}><Trash2 className="mr-2"/>Delete Project</Button></CardFooter>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div>
                <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold font-headline">Education</h2><Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem("education")}><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button></div>
                 <div className="space-y-4">
                    {resume.education.map((edu, eduIndex) => (
                    <Card key={edu.id}>
                        <CardContent className="p-4 space-y-2">
                           <Input disabled={editorDisabled} value={edu.degree} onChange={(e) => handleUpdate((d) => (d.education[eduIndex].degree = e.target.value))} placeholder="Degree / Certificate" className="font-bold"/>
                           <Input disabled={editorDisabled} value={edu.school} onChange={(e) => handleUpdate((d) => (d.education[eduIndex].school = e.target.value))} placeholder="School / Institution"/>
                           <div className="flex gap-2">
                             <Input disabled={editorDisabled} value={edu.location} onChange={(e) => handleUpdate((d) => (d.education[eduIndex].location = e.target.value))} placeholder="Location"/>
                             <Input disabled={editorDisabled} value={edu.dates} onChange={(e) => handleUpdate((d) => (d.education[eduIndex].dates = e.target.value))} placeholder="Dates"/>
                           </div>
                        </CardContent>
                        <CardFooter className="flex justify-end p-2 border-t"><Button disabled={editorDisabled} variant="ghost" size="sm" onClick={() => removeSectionItem("education", eduIndex)}><Trash2 className="mr-2"/>Delete Section</Button></CardFooter>
                    </Card>
                    ))}
                </div>
            </div>
            
            {/* Simple String Array Sections */}
            {[
              { key: 'skills' as const, title: 'Skills', icon: <Sparkles/> },
              { key: 'achievements' as const, title: 'Achievements', icon: <Trophy/> },
              { key: 'hobbies' as const, title: 'Hobbies', icon: <Heart/> },
            ].map(({ key, title, icon }) => (
                <div key={key}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">{icon}{title}</h2>
                        <Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem(key)}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
                    </div>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-2">
                            {(resume[key] || []).map((item, index) => (
                                <div key={index} className="flex items-center group rounded-md bg-accent">
                                <Input disabled={editorDisabled} value={item} onChange={(e) => handleUpdate(d => { (d[key] as string[])[index] = e.target.value })} className="border-none focus:ring-0 shadow-none bg-transparent h-8 text-foreground" placeholder={`New ${title.slice(0, -1)}`}/>
                                <Button disabled={editorDisabled} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeSectionItem(key, index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Preview Column */}
      <div className="hidden lg:flex flex-col w-[45%] max-w-[8.5in] bg-gray-800 shadow-2xl">
          <header className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-border">
            <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Change template" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                </SelectContent>
            </Select>
          </header>
          <div className="p-4 flex-1 overflow-auto">
             <div className="bg-white rounded-lg shadow-lg origin-top scale-[0.9] -translate-y-8">
                <ResumePreview ref={previewRef} resumeData={resume} templateName={template} />
             </div>
          </div>
      </div>
    </div>
  );
}
