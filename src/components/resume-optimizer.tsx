"use client";

import { useState } from "react";
import { Download, FileUp, Loader2, Sparkles } from "lucide-react";
import { optimizeResumeForAts } from "@/ai/flows/ats-optimization";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export function ResumeOptimizer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeDataUri, setResumeDataUri] = useState<string | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<string>("");
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

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
        });
        setResumeFile(null);
        setResumeDataUri(null);
        event.target.value = '';
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

  const handleOptimize = async () => {
    if (!resumeDataUri) {
      toast({
        variant: "destructive",
        title: "No resume uploaded",
        description: "Please upload your resume before optimizing.",
      });
      return;
    }

    setIsLoading(true);
    setOptimizedResume("");
    try {
      const result = await optimizeResumeForAts({
        resumePdfDataUri: resumeDataUri,
      });
      setOptimizedResume(result.optimizedResumeText);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description:
          "There was an error optimizing your resume. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!optimizedResume) return;
    const blob = new Blob([optimizedResume], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized-resume.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          onClick={handleOptimize}
          disabled={!resumeFile || isLoading}
          className="self-end"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Optimize Resume
            </>
          )}
        </Button>
      </div>

      {(isLoading || optimizedResume) && (
        <div className="space-y-4">
          <h3 className="font-headline text-lg font-semibold">
            Optimized Resume
          </h3>
          {isLoading ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <Textarea
                  readOnly
                  value={optimizedResume}
                  className="h-96 min-h-[24rem] bg-secondary/30"
                  placeholder="Your optimized resume will appear here."
                  aria-label="Optimized Resume"
                />
              </CardContent>
            </Card>
          )}

          {!isLoading && optimizedResume && (
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download as .txt
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
