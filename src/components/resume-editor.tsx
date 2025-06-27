
"use client";

import React, { useRef, useState } from "react";
import {
  ChevronLeft,
  Download,
  FileText,
  Loader2,
  Move,
  Pencil,
  PlusCircle,
  Redo,
  Sparkles,
  Trash2,
  Undo,
} from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
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
import { ResumePreview } from "./resume-preview";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";

interface ResumeEditorProps {
  initialResumeData: ResumeDataWithIds;
  onBack: () => void;
}

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

  const addSectionItem = (
    section: "experience" | "education" | "skills"
  ) => {
    handleUpdate((draft) => {
      if (section === "experience") {
        draft.experience.push({
          id: crypto.randomUUID(),
          title: "",
          company: "",
          location: "",
          dates: "",
          responsibilities: [""],
        });
      } else if (section === "education") {
        draft.education.push({
          id: crypto.randomUUID(),
          degree: "",
          school: "",
          location: "",
          dates: "",
        });
      } else if (section === "skills") {
        draft.skills.push("");
      }
    });
  };

  const removeSectionItem = (
    section: "experience" | "education" | "skills",
    index: number
  ) => {
    handleUpdate((draft) => {
      (draft[section] as any[]).splice(index, 1);
    });
  };

  const addResponsibility = (expIndex: number) => {
    handleUpdate((draft) => {
      draft.experience[expIndex].responsibilities.push("");
    });
  };

  const removeResponsibility = (expIndex: number, respIndex: number) => {
    handleUpdate((draft) => {
      draft.experience[expIndex].responsibilities.splice(respIndex, 1);
    });
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      // We need to strip the IDs before sending to the AI
      const resumeForApi: ResumeData = {
        ...resume,
        experience: resume.experience.map(({ id, ...rest }) => rest),
        education: resume.education.map(({ id, ...rest }) => rest),
      };
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
        scale: 3, // Increased scale for better quality
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt", // Use points for better precision
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = imgProps.height / imgProps.width;
      const imgHeight = pdfWidth * ratio;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${resume.name.replace(/\s+/g, "_")}_resume.pdf`);
    } catch (error) {
      console.error(error);
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
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: resume.name, heading: "Title" }),
              new Paragraph({
                text: `${resume.email} | ${resume.phone}${
                  resume.linkedin ? ` | ${resume.linkedin}` : ""
                }`,
              }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "Summary", heading: "Heading1" }),
              new Paragraph(resume.summary),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "Experience", heading: "Heading1" }),
              ...resume.experience.flatMap((exp) => [
                new Paragraph({
                  children: [
                    new TextRun({ text: exp.title, bold: true }),
                    new TextRun({ text: `, ${exp.company}` }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: `${exp.location} | ${exp.dates}`, italics: true }),
                  ],
                }),
                ...exp.responsibilities.map(
                  (resp) => new Paragraph({ text: resp, bullet: { level: 0 } })
                ),
                new Paragraph(" "),
              ]),
              new Paragraph({ text: "Education", heading: "Heading1" }),
              ...resume.education.map(
                (edu) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${edu.degree}, ${edu.school}`,
                        bold: true,
                      }),
                      new TextRun(` (${edu.dates})`).break(),
                    ],
                  })
              ),
               new Paragraph({ text: "" }),
              new Paragraph({ text: "Skills", heading: "Heading1" }),
              new Paragraph(resume.skills.join(", ")),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${resume.name.replace(/\s+/g, "_")}_resume.docx`);
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
            <Button variant="ghost" onClick={onBack}>
                <ChevronLeft className="mr-2" /> Back
            </Button>
            <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-headline hidden sm:block">Resume Editor</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={undo} disabled={!canUndo || editorDisabled} variant="outline" size="sm">
                  <Undo className="mr-2" /> Undo
                </Button>
                <Button onClick={redo} disabled={!canRedo || editorDisabled} variant="outline" size="sm">
                  <Redo className="mr-2" /> Redo
                </Button>
            </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-8 space-y-8 max-w-4xl mx-auto">
             {/* Contact Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input disabled={editorDisabled} value={resume.name} onChange={(e) => handleUpdate((draft) => (draft.name = e.target.value))} placeholder="Your Name" />
                    <Input disabled={editorDisabled} value={resume.email} onChange={(e) => handleUpdate((draft) => (draft.email = e.target.value))} placeholder="your.email@example.com" />
                    <Input disabled={editorDisabled} value={resume.phone} onChange={(e) => handleUpdate((draft) => (draft.phone = e.target.value))} placeholder="Your Phone" />
                    <Input disabled={editorDisabled} value={resume.linkedin || ""} onChange={(e) => handleUpdate((draft) => (draft.linkedin = e.target.value))} placeholder="LinkedIn Profile" />
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea disabled={editorDisabled} value={resume.summary} onChange={(e) => handleUpdate((draft) => (draft.summary = e.target.value))} placeholder="A brief professional summary..." rows={5}/>
                </CardContent>
            </Card>

            {/* Experience */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Experience</h2>
                    <Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem("experience")}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                    </Button>
                </div>
                <div className="space-y-4">
                    {resume.experience.map((exp, expIndex) => (
                    <Card key={exp.id}>
                        <CardContent className="p-4 space-y-2">
                             <Input disabled={editorDisabled} value={exp.title} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].title = e.target.value))} placeholder="Job Title" className="font-bold"/>
                             <Input disabled={editorDisabled} value={exp.company} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].company = e.target.value))} placeholder="Company"/>
                             <div className="flex gap-2">
                                <Input disabled={editorDisabled} value={exp.location} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].location = e.target.value))} placeholder="Location"/>
                                <Input disabled={editorDisabled} value={exp.dates} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].dates = e.target.value))} placeholder="Dates (e.g., Jan 2020 - Present)"/>
                             </div>
                             <ul className="space-y-2 pt-2">
                                {exp.responsibilities.map((resp, respIndex) => (
                                    <li key={respIndex} className="flex items-center gap-2">
                                        <Textarea disabled={editorDisabled} value={resp} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].responsibilities[respIndex] = e.target.value))} className="w-full" placeholder="Responsibility or achievement" rows={2}/>
                                        <Button disabled={editorDisabled} variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeResponsibility(expIndex, respIndex)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                             </ul>
                            <Button disabled={editorDisabled} variant="outline" size="sm" onClick={() => addResponsibility(expIndex)}><PlusCircle className="mr-2 h-4 w-4" /> Add Responsibility</Button>
                        </CardContent>
                         <CardFooter className="flex justify-end p-2 border-t">
                            <Button disabled={editorDisabled} variant="ghost" size="sm" onClick={() => removeSectionItem("experience", expIndex)}><Trash2 className="mr-2"/>Delete Section</Button>
                        </CardFooter>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Education</h2>
                    <Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem("education")}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                    </Button>
                </div>
                 <div className="space-y-4">
                    {resume.education.map((edu, eduIndex) => (
                    <Card key={edu.id}>
                        <CardContent className="p-4 space-y-2">
                           <Input disabled={editorDisabled} value={edu.degree} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].degree = e.target.value))} placeholder="Degree / Certificate" className="font-bold"/>
                           <Input disabled={editorDisabled} value={edu.school} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].school = e.target.value))} placeholder="School / Institution"/>
                           <div className="flex gap-2">
                             <Input disabled={editorDisabled} value={edu.location} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].location = e.target.value))} placeholder="Location"/>
                             <Input disabled={editorDisabled} value={edu.dates} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].dates = e.target.value))} placeholder="Dates"/>
                           </div>
                        </CardContent>
                        <CardFooter className="flex justify-end p-2 border-t">
                            <Button disabled={editorDisabled} variant="ghost" size="sm" onClick={() => removeSectionItem("education", eduIndex)}><Trash2 className="mr-2"/>Delete Section</Button>
                        </CardFooter>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Skills */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Skills</h2>
                    <Button disabled={editorDisabled} variant="outline" onClick={() => addSectionItem("skills")}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill, skillIndex) => (
                            <div key={skillIndex} className="flex items-center group rounded-md bg-accent">
                            <Input disabled={editorDisabled} value={skill} onChange={(e) => handleUpdate((draft) => (draft.skills[skillIndex] = e.target.value))} className="border-none focus:ring-0 shadow-none bg-transparent h-8 text-foreground" placeholder="New Skill"/>
                            <Button disabled={editorDisabled} variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeSectionItem("skills", skillIndex)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Preview Column */}
      <div className="hidden lg:flex flex-col w-[45%] max-w-[8.5in] bg-gray-800 shadow-2xl">
          <header className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-border">
            <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Change template" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
                 <Button onClick={handleDownloadPdf} disabled={editorDisabled} variant="outline">
                    {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    PDF
                 </Button>
                 <Button onClick={handleDownloadDocx} disabled={editorDisabled} variant="outline">
                    {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    DOCX
                 </Button>
            </div>
          </header>
          <div className="p-4 flex-1 overflow-auto">
             <div className="bg-white rounded-lg shadow-lg origin-top scale-[0.9] -translate-y-8">
                <ResumePreview ref={previewRef} resumeData={resume} templateName={template} />
             </div>
          </div>
          <footer className="p-4 border-t border-border bg-gray-900/50">
                <Button onClick={handleEnhance} disabled={editorDisabled} className="w-full" size="lg">
                    {isEnhancing ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                    Enhance with AI
                </Button>
            </footer>
      </div>
    </div>
  );
}
