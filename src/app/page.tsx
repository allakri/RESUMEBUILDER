
"use client";

import { useState } from "react";
import { Camera, FileText, Plus, Upload } from "lucide-react";
import { ResumeEditor } from "@/components/resume-editor";
import { ResumeOptimizer } from "@/components/resume-optimizer";
import { type ResumeDataWithIds } from "@/ai/resume-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeCameraCapture } from "@/components/resume-camera-capture";
import { ResumeWizard } from "@/components/resume-wizard";

type Step = "CHOICE" | "UPLOAD" | "CAMERA" | "EDIT" | "WIZARD";

const BLANK_RESUME: ResumeDataWithIds = {
  firstName: "",
  lastName: "",
  profession: "",
  email: "",
  phone: "",
  location: "",
  pinCode: "",
  summary: "",
  experience: [],
  education: [],
  skills: [],
  websites: [],
  projects: [],
  achievements: [],
  hobbies: [],
  customSections: [],
  linkedIn: undefined,
  drivingLicense: undefined,
  profilePictureUrl: undefined
};


export default function Home() {
  const [step, setStep] = useState<Step>("CHOICE");
  const [resumeData, setResumeData] = useState<ResumeDataWithIds | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editorConfig, setEditorConfig] = useState({ template: 'modern', color: '#4169E1' });


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
    setStep("WIZARD");
    setIsProcessing(false);
  };
  
  const handleBackToChoice = () => {
    setResumeData(null);
    setStep('CHOICE');
    setIsProcessing(false);
  }

  const handleWizardComplete = (data: { resume: ResumeDataWithIds, template: string, color: string }) => {
    setResumeData(data.resume);
    setEditorConfig({ template: data.template, color: data.color });
    setStep("EDIT");
  };

  const handleBackToWizard = () => {
    setStep("WIZARD");
  };

  if (step === "WIZARD" && resumeData) {
    return <ResumeWizard 
      initialResumeData={resumeData} 
      onComplete={handleWizardComplete} 
      onBack={handleBackToChoice} 
    />;
  }

  if (step === "EDIT" && resumeData) {
    return <ResumeEditor 
            initialResumeData={resumeData} 
            onBack={handleBackToWizard} 
            template={editorConfig.template}
            color={editorConfig.color}
          />;
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 antialiased">
      <header className="mb-16 text-center">
        <div className="inline-block bg-primary/10 p-4 rounded-full mb-6 ring-8 ring-primary/5">
            <FileText className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">ResumeRevamp</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          Create a professional resume that stands out. Our AI tools will help you get past the bots and land your dream job.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <Card className="hover:border-primary hover:shadow-lg transition-all duration-300 text-center md:text-left">
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row items-center gap-2">
              <Plus />
              Create a new resume
            </CardTitle>
            <CardDescription>Start with a blank slate and build your resume step-by-step with our guided wizard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleStartFromScratch}>
              Start From Scratch
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary hover:shadow-lg transition-all duration-300 text-center md:text-left">
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row items-center gap-2">
              <Upload />
              Upload an existing resume
            </CardTitle>
            <CardDescription>Import a PDF, DOCX, or image file to get started instantly.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleUpload}>
              Upload & Optimize
            </Button>
          </CardContent>
        </Card>
         <Card className="hover:border-primary hover:shadow-lg transition-all duration-300 text-center md:text-left">
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row items-center gap-2">
              <Camera />
              Use your camera
            </CardTitle>
            <CardDescription>Take a photo of your resume and let our AI extract the info.</CardDescription>
          </CardHeader>
          <CardContent>
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
