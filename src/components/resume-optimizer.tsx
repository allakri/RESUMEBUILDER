
"use client";

import { useState } from "react";
import { Loader2, Sparkles, ChevronLeft, UploadCloud } from "lucide-react";
import { optimizeResumeForAts } from "@/ai/flows/ats-optimization";
import { createResume } from "@/ai/flows/create-resume";
import { type ResumeData, type ResumeDataWithIds } from "@/ai/resume-schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

interface ResumeOptimizerProps {
  onComplete: (data: ResumeDataWithIds) => void;
  onProcessing: (isProcessing: boolean) => void;
  isProcessing: boolean;
  onBack: () => void;
}

export function ResumeOptimizer({ onComplete, onProcessing, isProcessing, onBack }: ResumeOptimizerProps) {
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFiles = (files: FileList | null) => {
    if (files) {
      const fileList = Array.from(files);
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      
      const validFiles = fileList.filter(file => {
        if (!allowedTypes.includes(file.type)) {
          toast({
            variant: "destructive",
            title: "Invalid file type",
            description: `File '${file.name}' was ignored. Please upload a PDF, DOCX, or Image file.`,
          });
          return false;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
            variant: "destructive",
            title: "File too large",
            description: `File '${file.name}' is too large. Please upload files smaller than 5MB.`,
          });
          return false;
        }
        return true;
      });

      setResumeFiles(validFiles);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    // Reset file input to allow selecting the same file again
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFiles(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleOptimizeAndCreate = async () => {
    if (resumeFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "No resume file selected",
        description: "Please upload your resume before optimizing.",
      });
      return;
    }

    onProcessing(true);
    
    const processFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if(e.target?.result) {
                    resolve(e.target.result as string);
                } else {
                    reject(new Error("Error reading file."));
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });
    };

    try {
      const resumeDataUri = await processFile(resumeFiles[0]);

      // Step 1: Optimize resume to get text
      const optimizationResult = await optimizeResumeForAts({
        resumePdfDataUri: resumeDataUri,
      });

      // Step 2: Create structured resume from optimized text
      const structuredResult: ResumeData = await createResume({
        resumeText: optimizationResult.optimizedResumeText,
      });

      const resumeWithIds: ResumeDataWithIds = {
        ...structuredResult,
        experience: structuredResult.experience.map((exp) => ({ ...exp, id: crypto.randomUUID() })),
        education: structuredResult.education.map((edu) => ({ ...edu, id: crypto.randomUUID() })),
        skills: structuredResult.skills || [],
        websites: (structuredResult.websites || []).map((site) => ({ ...site, id: crypto.randomUUID() })),
        projects: (structuredResult.projects || []).map((proj) => ({ ...proj, id: crypto.randomUUID() })),
        achievements: structuredResult.achievements || [],
        hobbies: structuredResult.hobbies || [],
        customSections: (structuredResult.customSections || []).map((sec) => ({ ...sec, id: crypto.randomUUID() })),
      };

      onComplete(resumeWithIds);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description:
          "There was an error processing your resume. Please try again.",
      });
      onProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">
          Analyzing and building your resume...
        </p>
        <p className="text-sm text-muted-foreground">This may take a moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-4 flex flex-col">
        <div className="self-start">
            <Button variant="outline" size="sm" onClick={onBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
        </div>
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UploadCloud />
                    Upload Resume
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div 
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 text-center transition-colors duration-300",
                    isDragging && "border-primary bg-accent"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Drag and drop files here, or click to select files.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG, or PNG (max 5MB)</p>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    multiple={true}
                  />
                </div>
                
                {resumeFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Selected Files:</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {resumeFiles.map((file, index) => <li key={index}>{file.name}</li>)}
                    </ul>
                    {resumeFiles.length > 1 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 pt-2">
                          Note: Only the first file ({resumeFiles[0].name}) will be used to create the initial resume. You can use other files as references inside the editor.
                        </p>
                    )}
                  </div>
                )}
                
                <Button
                    onClick={handleOptimizeAndCreate}
                    disabled={resumeFiles.length === 0 || isProcessing}
                    className="w-full"
                    size="lg"
                >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Optimize & Edit
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
