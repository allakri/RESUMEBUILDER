"use client";

import { useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { optimizeResumeForAts } from "@/ai/flows/ats-optimization";
import { createResume, ResumeDataWithIds } from "@/ai/flows/create-resume";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResumeEditor } from "./resume-editor";

export function ResumeOptimizer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDataUri, setResumeDataUri] = useState<string | null>(null);
  const [structuredResume, setStructuredResume] =
    useState<ResumeDataWithIds | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF file.",
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

    setIsLoading(true);
    setStructuredResume(null);
    try {
      // Step 1: Optimize resume to get text
      const optimizationResult = await optimizeResumeForAts({
        resumePdfDataUri: resumeDataUri,
      });

      // Step 2: Create structured resume from optimized text
      const structuredResult = await createResume({
        resumeText: optimizationResult.optimizedResumeText,
      });

      const resumeWithIds: ResumeDataWithIds = {
        ...structuredResult,
        experience: structuredResult.experience.map((exp) => ({
          ...exp,
          id: crypto.randomUUID(),
        })),
        education: structuredResult.education.map((edu) => ({
          ...edu,
          id: crypto.randomUUID(),
        })),
      };

      setStructuredResume(resumeWithIds);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description:
          "There was an error processing your resume. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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

  if (structuredResume) {
    return <ResumeEditor initialResumeData={structuredResume} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <label
            htmlFor="resume-upload"
            className="block text-sm font-medium text-foreground"
          >
            Upload your resume (PDF only)
          </label>
          <div className="relative">
            <Input
              id="resume-upload"
              type="file"
              accept=".pdf"
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
          disabled={!resumeFile || isLoading}
          className="self-end"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Create Resume
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
