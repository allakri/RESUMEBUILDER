"use client";

import { useState } from "react";
import { FileText, Plus, Upload } from "lucide-react";
import { ResumeEditor } from "@/components/resume-editor";
import { ResumeOptimizer } from "@/components/resume-optimizer";
import { type ResumeDataWithIds } from "@/ai/flows/create-resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "CHOICE" | "UPLOAD" | "EDIT";

const BLANK_RESUME: ResumeDataWithIds = {
  name: "Your Name",
  email: "your.email@example.com",
  phone: "123-456-7890",
  linkedin: "linkedin.com/in/yourprofile",
  summary: "A brief professional summary about you.",
  experience: [
    {
      id: crypto.randomUUID(),
      title: "Job Title",
      company: "Company Name",
      location: "City, State",
      dates: "Month Year - Present",
      responsibilities: ["Responsibility or achievement."],
    },
  ],
  education: [
    {
      id: crypto.randomUUID(),
      degree: "Degree or Certificate",
      school: "University or Institution",
      location: "City, State",
      dates: "Month Year - Month Year",
    },
  ],
  skills: ["Skill 1", "Skill 2", "Skill 3"],
};


export default function Home() {
  const [step, setStep] = useState<Step>("CHOICE");
  const [resumeData, setResumeData] = useState<ResumeDataWithIds | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartFromScratch = () => {
    setResumeData(BLANK_RESUME);
    setStep("EDIT");
  };

  const handleUpload = () => {
    setStep("UPLOAD");
  };

  const handleProcessingComplete = (data: ResumeDataWithIds) => {
    setResumeData(data);
    setStep("EDIT");
    setIsProcessing(false);
  };
  
  const handleBackToChoice = () => {
    setResumeData(null);
    setStep('CHOICE');
  }

  if (step === "EDIT" && resumeData) {
    return <ResumeEditor initialResumeData={resumeData} onBack={handleBackToChoice} />;
  }
  
  if (step === "UPLOAD") {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <ResumeOptimizer
                onComplete={handleProcessingComplete}
                onProcessing={setIsProcessing}
                isProcessing={isProcessing}
            />
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="mb-12 text-center">
        <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-5xl font-bold font-headline">ResumeRevamp</h1>
        <p className="text-muted-foreground mt-2">
          Let's build your perfect resume.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Card className="hover:border-primary transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus />
              Create a new resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start with a blank slate and build your resume step-by-step.
            </p>
            <Button className="w-full" onClick={handleStartFromScratch}>
              Start From Scratch
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary transition-colors duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload />
              Upload an existing resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Let our AI analyze your resume and pre-fill the editor for you.
            </p>
            <Button className="w-full" onClick={handleUpload}>
              Upload & Optimize
            </Button>
          </CardContent>
        </Card>
      </div>
      <footer className="text-center text-sm text-muted-foreground p-4 mt-12">
        <p>
          &copy; {new Date().getFullYear()} ResumeRevamp. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
