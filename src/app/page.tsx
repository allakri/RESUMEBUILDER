"use client";

import { useState } from "react";
import { Camera, FileText, Plus, Upload } from "lucide-react";
import { ResumeEditor } from "@/components/resume-editor";
import { ResumeOptimizer } from "@/components/resume-optimizer";
import { type ResumeDataWithIds } from "@/ai/resume-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeCameraCapture } from "@/components/resume-camera-capture";
import { ResumeWizard } from "@/components/resume-wizard";

type Step = "CHOICE" | "UPLOAD" | "CAMERA" | "EDIT" | "WIZARD";

const BLANK_RESUME: ResumeDataWithIds = {
  name: "Your Name",
  email: "your.email@example.com",
  phone: "123-456-7890",
  location: "City, Country",
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
  websites: [],
  projects: [],
  achievements: [],
  hobbies: [],
  customSections: [],
};


export default function Home() {
  const [step, setStep] = useState<Step>("CHOICE");
  const [resumeData, setResumeData] = useState<ResumeDataWithIds | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartFromScratch = () => {
    setResumeData(BLANK_RESUME);
    setStep("WIZARD");
  };

  const handleUpload = () => {
    setStep("UPLOAD");
  };

  const handleUseCamera = () => {
    setStep("CAMERA");
  };

  const handleProcessingComplete = (data: ResumeDataWithIds) => {
    setResumeData(data);
    setStep("EDIT");
    setIsProcessing(false);
  };
  
  const handleBackToChoice = () => {
    setResumeData(null);
    setStep('CHOICE');
    setIsProcessing(false);
  }

  const handleWizardComplete = (data: ResumeDataWithIds) => {
    setResumeData(data);
    setStep("EDIT");
  };

  if (step === "WIZARD" && resumeData) {
    return <ResumeWizard 
      initialResumeData={resumeData} 
      onComplete={handleWizardComplete} 
      onBack={handleBackToChoice} 
    />;
  }

  if (step === "EDIT" && resumeData) {
    return <ResumeEditor initialResumeData={resumeData} onBack={handleBackToChoice} />;
  }
  
  if (step === "UPLOAD") {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <ResumeOptimizer
                onComplete={handleProcessingComplete}
                onProcessing={setIsProcessing}
                isProcessing={isProcessing}
                onBack={handleBackToChoice}
            />
        </div>
    );
  }

  if (step === "CAMERA") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ResumeCameraCapture
          onComplete={handleProcessingComplete}
          onProcessing={setIsProcessing}
          isProcessing={isProcessing}
          onBack={handleBackToChoice}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <header className="mb-16 text-center">
        <div className="inline-block bg-primary/10 p-4 rounded-full mb-6">
            <FileText className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">ResumeRevamp</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          Create a professional resume that stands out. Our AI tools will help you get past the bots and land your dream job.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <Card className="hover:border-primary hover:shadow-lg transition-all duration-300">
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
        <Card className="hover:border-primary hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload />
              Upload an existing resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Import a PDF, DOCX, or image file to get started instantly.
            </p>
            <Button className="w-full" onClick={handleUpload}>
              Upload & Optimize
            </Button>
          </CardContent>
        </Card>
         <Card className="hover:border-primary hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera />
              Use your camera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Take a photo of your resume and let our AI extract the info.
            </p>
            <Button className="w-full" onClick={handleUseCamera}>
              Take Photo
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
