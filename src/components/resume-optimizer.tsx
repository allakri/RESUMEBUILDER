
"use client";

import { useState } from "react";
import { FileUp, Loader2, Sparkles, Upload, ChevronLeft } from "lucide-react";
import { optimizeResumeForAts } from "@/ai/flows/ats-optimization";
import { createResume } from "@/ai/flows/create-resume";
import { type ResumeData, type ResumeDataWithIds } from "@/ai/resume-schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ResumeOptimizerProps {
  onComplete: (data: ResumeDataWithIds) => void;
  onProcessing: (isProcessing: boolean) => void;
  isProcessing: boolean;
  onBack: () => void;
}

export function ResumeOptimizer({ onComplete, onProcessing, isProcessing, onBack }: ResumeOptimizerProps) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDataUri, setResumeDataUri] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF, DOCX, or Image file.",
        });
        setResumeFile(null);
        setResumeDataUri(null);
        event.target.value = ""; // Reset file input
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
        });
        setResumeFile(null);
        setResumeDataUri(null);
        event.target.value = "";
        return;
      }

      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setResumeDataUri(e.target?.result as string);
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Error reading file",
          description: "There was an issue reading your resume file.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptimizeAndCreate = async () => {
    if (!resumeDataUri) {
      toast({
        variant: "destructive",
        title: "No resume uploaded",
        description: "Please upload your resume before optimizing.",
      });
      return;
    }

    onProcessing(true);
    try {
      // Step 1: Optimize resume to get text
      const optimizationResult = await optimizeResumeForAts({
        resumePdfDataUri: resumeDataUri,
      });

      // Step 2: Create structured resume from optimized text
      const structuredResult: ResumeData = await createResume({
        resumeText: optimizationResult.optimizedResumeText,
      });

      const resumeWithIds: ResumeDataWithIds = {
        name: structuredResult.name,
        email: structuredResult.email,
        phone: structuredResult.phone,
        summary: structuredResult.summary,
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
                    <Upload />
                    Upload an existing resume
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label
                        htmlFor="resume-upload"
                        className="block text-sm font-medium text-foreground"
                    >
                        Upload your resume (PDF, DOCX, JPG, PNG)
                    </label>
                    <div className="relative">
                        <Input
                        id="resume-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="pr-12"
                        />
                        <FileUp className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    </div>
                    {resumeFile && (
                        <p className="text-sm text-muted-foreground">
                        Selected: {resumeFile.name}
                        </p>
                    )}
                </div>
                <Button
                    onClick={handleOptimizeAndCreate}
                    disabled={!resumeFile || isProcessing}
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
