
"use client";

import { useRef, useState } from "react";
import {
  Download,
  Loader2,
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
  const resumeRef = useRef<HTMLDivElement>(null);
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
        scale: 2.5, // High scale for better quality
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
      <div className="flex flex-wrap gap-2 items-center sticky top-0 bg-background/90 backdrop-blur-sm p-2 -mx-2 rounded-md border z-10">
        <h3 className="font-headline text-lg font-semibold flex-grow">
          Resume Editor
        </h3>
        <Button onClick={undo} disabled={!canUndo} variant="outline" size="sm">
          <Undo className="mr-2" /> Undo
        </Button>
        <Button onClick={redo} disabled={!canRedo} variant="outline" size="sm">
          <Redo className="mr-2" /> Redo
        </Button>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modern">Modern</SelectItem>
            <SelectItem value="classic">Classic</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          variant="outline"
          size="sm"
        >
          {isDownloading ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <Download className="mr-2" />
          )}
          PDF
        </Button>
        <Button
          onClick={handleDownloadDocx}
          disabled={isDownloading}
          variant="outline"
          size="sm"
        >
          {isDownloading ? (
            <Loader2 className="mr-2 animate-spin" />
          ) : (
            <Download className="mr-2" />
          )}
          DOCX
        </Button>
      </div>
      
      <div className="absolute top-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden="true">
        <ResumePreview ref={previewRef} resumeData={resume} templateName={template} />
      </div>

      <div
        ref={resumeRef}
        className="p-4 sm:p-8 bg-white text-gray-800 rounded-lg shadow-lg"
      >
        <div className="text-center border-b pb-4 mb-4">
          <Input
            value={resume.name}
            onChange={(e) => handleUpdate((draft) => (draft.name = e.target.value))}
            className="text-3xl font-bold text-center border-none focus:ring-0 shadow-none h-auto p-0"
            placeholder="Your Name"
          />
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-sm mt-2">
            <Input
              value={resume.email}
              onChange={(e) => handleUpdate((draft) => (draft.email = e.target.value))}
              className="border-none focus:ring-0 shadow-none text-center h-auto p-0"
              placeholder="your.email@example.com"
            />
            <Input
              value={resume.phone}
              onChange={(e) => handleUpdate((draft) => (draft.phone = e.target.value))}
              className="border-none focus:ring-0 shadow-none text-center h-auto p-0"
              placeholder="Your Phone"
            />
            <Input
              value={resume.linkedin || ""}
              onChange={(e) =>
                handleUpdate((draft) => (draft.linkedin = e.target.value))
              }
              placeholder="LinkedIn Profile"
              className="border-none focus:ring-0 shadow-none text-center h-auto p-0"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold border-b-2 border-gray-700 pb-1 mb-2">
              Summary
            </h2>
            <Textarea
              value={resume.summary}
              onChange={(e) => handleUpdate((draft) => (draft.summary = e.target.value))}
              className="w-full border-none focus:ring-0 shadow-none p-0"
              placeholder="A brief professional summary..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold border-b-2 border-gray-700 pb-1">
                Experience
                </h2>
                <Button variant="ghost" size="sm" onClick={() => addSectionItem("experience")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                </Button>
            </div>
            {resume.experience.map((exp, expIndex) => (
              <div key={exp.id} className="mb-4 -ml-2 p-2 relative group hover:bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-x-4">
                  <Input
                    value={exp.title}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) => (draft.experience[expIndex].title = e.target.value)
                      )
                    }
                    placeholder="Job Title"
                    className="font-bold border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                  <Input
                    value={exp.company}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) =>
                          (draft.experience[expIndex].company = e.target.value)
                      )
                    }
                    placeholder="Company"
                    className="text-right border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                  <Input
                    value={exp.location}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) =>
                          (draft.experience[expIndex].location = e.target.value)
                      )
                    }
                    placeholder="Location"
                    className="text-sm text-gray-600 border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                  <Input
                    value={exp.dates}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) => (draft.experience[expIndex].dates = e.target.value)
                      )
                    }
                    placeholder="Dates (e.g., Jan 2020 - Present)"
                    className="text-sm text-gray-600 text-right border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                </div>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {exp.responsibilities.map((resp, respIndex) => (
                    <li key={respIndex} className="flex items-start group/item">
                      <Textarea
                        value={resp}
                        onChange={(e) =>
                          handleUpdate(
                            (draft) =>
                              (draft.experience[expIndex].responsibilities[
                                respIndex
                              ] = e.target.value)
                          )
                        }
                        className="w-full border-none focus:ring-0 shadow-none p-0"
                        placeholder="Responsibility or achievement"
                        rows={1}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover/item:opacity-100 flex-shrink-0"
                        onClick={() => removeResponsibility(expIndex, respIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addResponsibility(expIndex)}
                  className="mt-1"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Responsibility
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 absolute top-0 right-0 opacity-0 group-hover:opacity-100"
                  onClick={() => removeSectionItem("experience", expIndex)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>

          <div>
             <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold border-b-2 border-gray-700 pb-1">
                Education
                </h2>
                <Button variant="ghost" size="sm" onClick={() => addSectionItem("education")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                </Button>
            </div>
            {resume.education.map((edu, eduIndex) => (
              <div key={edu.id} className="mb-2 -ml-2 p-2 relative group hover:bg-slate-50 rounded-lg">
                <div className="grid grid-cols-2 gap-x-4">
                  <Input
                    value={edu.degree}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) => (draft.education[eduIndex].degree = e.target.value)
                      )
                    }
                    placeholder="Degree"
                    className="font-bold border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                  <Input
                    value={edu.school}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) => (draft.education[eduIndex].school = e.target.value)
                      )
                    }
                    placeholder="School"
                    className="text-right border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                   <Input
                    value={edu.location}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) => (draft.education[eduIndex].location = e.target.value)
                      )
                    }
                    placeholder="Location"
                    className="text-sm text-gray-600 border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                  <Input
                    value={edu.dates}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) => (draft.education[eduIndex].dates = e.target.value)
                      )
                    }
                    placeholder="Dates"
                    className="text-sm text-gray-600 text-right border-none focus:ring-0 shadow-none h-auto p-0"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 absolute top-0 right-0 opacity-0 group-hover:opacity-100"
                  onClick={() => removeSectionItem("education", eduIndex)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold border-b-2 border-gray-700 pb-1">
                Skills
                </h2>
                <Button variant="ghost" size="sm" onClick={() => addSectionItem("skills")}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
                </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, skillIndex) => (
                <div
                  key={skillIndex}
                  className="flex items-center group rounded-md bg-gray-200"
                >
                  <Input
                    value={skill}
                    onChange={(e) =>
                      handleUpdate(
                        (draft) => (draft.skills[skillIndex] = e.target.value)
                      )
                    }
                    className="border-none focus:ring-0 shadow-none bg-transparent h-8"
                    placeholder="New Skill"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => removeSectionItem("skills", skillIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
