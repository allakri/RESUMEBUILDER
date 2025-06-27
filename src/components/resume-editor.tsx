
"use client";

import React, { useRef, useState } from "react";
import {
  Download,
  Loader2,
  Move,
  Pencil,
  PlusCircle,
  Redo,
  Trash2,
  Undo,
} from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { ResumeDataWithIds } from "@/ai/flows/create-resume";
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

interface ResumeEditorProps {
  initialResumeData: ResumeDataWithIds;
}

export function ResumeEditor({ initialResumeData }: ResumeEditorProps) {
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

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-3xl font-bold">Resume Editor</h1>
        <div className="flex items-center gap-2">
            <Button onClick={undo} disabled={!canUndo} variant="outline" size="sm">
              <Undo className="mr-2" /> Undo
            </Button>
            <Button onClick={redo} disabled={!canRedo} variant="outline" size="sm">
              <Redo className="mr-2" /> Redo
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isDownloading} variant="outline" size="sm">
              {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
              PDF
            </Button>
            <Button onClick={handleDownloadDocx} disabled={isDownloading} variant="outline" size="sm">
              {isDownloading ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
              DOCX
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Editor Column */}
        <div className="lg:col-span-2 space-y-8">
            {/* Contact Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input value={resume.name} onChange={(e) => handleUpdate((draft) => (draft.name = e.target.value))} placeholder="Your Name" />
                    <Input value={resume.email} onChange={(e) => handleUpdate((draft) => (draft.email = e.target.value))} placeholder="your.email@example.com" />
                    <Input value={resume.phone} onChange={(e) => handleUpdate((draft) => (draft.phone = e.target.value))} placeholder="Your Phone" />
                    <Input value={resume.linkedin || ""} onChange={(e) => handleUpdate((draft) => (draft.linkedin = e.target.value))} placeholder="LinkedIn Profile" />
                </CardContent>
            </Card>

            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea value={resume.summary} onChange={(e) => handleUpdate((draft) => (draft.summary = e.target.value))} placeholder="A brief professional summary..." rows={5}/>
                </CardContent>
            </Card>

            {/* Experience */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Experience</h2>
                    <Button variant="outline" onClick={() => addSectionItem("experience")}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                    </Button>
                </div>
                <div className="space-y-4">
                    {resume.experience.map((exp, expIndex) => (
                    <Card key={exp.id}>
                        <CardContent className="p-4 space-y-2">
                             <Input value={exp.title} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].title = e.target.value))} placeholder="Job Title" className="font-bold"/>
                             <Input value={exp.company} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].company = e.target.value))} placeholder="Company"/>
                             <div className="flex gap-2">
                                <Input value={exp.location} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].location = e.target.value))} placeholder="Location"/>
                                <Input value={exp.dates} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].dates = e.target.value))} placeholder="Dates (e.g., Jan 2020 - Present)"/>
                             </div>
                             <ul className="space-y-2 pt-2">
                                {exp.responsibilities.map((resp, respIndex) => (
                                    <li key={respIndex} className="flex items-center gap-2">
                                        <Textarea value={resp} onChange={(e) => handleUpdate((draft) => (draft.experience[expIndex].responsibilities[respIndex] = e.target.value))} className="w-full" placeholder="Responsibility or achievement" rows={1}/>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeResponsibility(expIndex, respIndex)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                             </ul>
                            <Button variant="outline" size="sm" onClick={() => addResponsibility(expIndex)}><PlusCircle className="mr-2 h-4 w-4" /> Add Responsibility</Button>
                        </CardContent>
                         <CardFooter className="flex justify-between p-4 border-t">
                            <Button variant="ghost" size="sm" className="relative"><span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>See suggestions</Button>
                            <div>
                                <Button variant="ghost" size="sm"><Pencil className="mr-2"/>Edit</Button>
                                <Button variant="ghost" size="sm" onClick={() => removeSectionItem("experience", expIndex)}><Trash2 className="mr-2"/>Delete</Button>
                                <Button variant="ghost" size="sm"><Move className="mr-2"/>Move</Button>
                            </div>
                        </CardFooter>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Education */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Education</h2>
                    <Button variant="outline" onClick={() => addSectionItem("education")}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                    </Button>
                </div>
                 <div className="space-y-4">
                    {resume.education.map((edu, eduIndex) => (
                    <Card key={edu.id}>
                        <CardContent className="p-4 space-y-2">
                           <Input value={edu.degree} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].degree = e.target.value))} placeholder="Degree / Certificate" className="font-bold"/>
                           <Input value={edu.school} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].school = e.target.value))} placeholder="School / Institution"/>
                           <div className="flex gap-2">
                             <Input value={edu.location} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].location = e.target.value))} placeholder="Location"/>
                             <Input value={edu.dates} onChange={(e) => handleUpdate((draft) => (draft.education[eduIndex].dates = e.target.value))} placeholder="Dates"/>
                           </div>
                        </CardContent>
                         <CardFooter className="flex justify-between p-4 border-t">
                            <Button variant="ghost" size="sm" className="relative"><span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>See suggestions</Button>
                            <div>
                                <Button variant="ghost" size="sm"><Pencil className="mr-2"/>Edit</Button>
                                <Button variant="ghost" size="sm" onClick={() => removeSectionItem("education", eduIndex)}><Trash2 className="mr-2"/>Delete</Button>
                                <Button variant="ghost" size="sm"><Move className="mr-2"/>Move</Button>
                            </div>
                        </CardFooter>
                    </Card>
                    ))}
                </div>
            </div>

            {/* Skills */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Skills</h2>
                    <Button variant="outline" onClick={() => addSectionItem("skills")}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill, skillIndex) => (
                            <div key={skillIndex} className="flex items-center group rounded-md bg-gray-200">
                            <Input value={skill} onChange={(e) => handleUpdate((draft) => (draft.skills[skillIndex] = e.target.value))} className="border-none focus:ring-0 shadow-none bg-transparent h-8 text-black" placeholder="New Skill"/>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeSectionItem("skills", skillIndex)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
             <div className="bg-white rounded-lg shadow-lg border">
                <ResumePreview ref={previewRef} resumeData={resume} templateName={template} />
             </div>
             <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                    <SelectValue placeholder="Change template" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
