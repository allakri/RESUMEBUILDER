"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, CameraOff, Loader2, Zap, ChevronLeft } from "lucide-react";
import { optimizeResumeForAts } from "@/ai/flows/ats-optimization";
import { createResume } from "@/ai/flows/create-resume";
import { type ResumeData, type ResumeDataWithIds } from "@/ai/resume-schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ResumeCameraCaptureProps {
  onComplete: (data: ResumeDataWithIds) => void;
  onProcessing: (isProcessing: boolean) => void;
  isProcessing: boolean;
  onBack: () => void;
}

export function ResumeCameraCapture({ onComplete, onProcessing, isProcessing, onBack }: ResumeCameraCaptureProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not supported in this browser.");
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Not Supported",
          description: "Your browser does not support the camera API.",
        });
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Camera Access Denied",
          description: "Please enable camera permissions in your browser settings to use this feature.",
        });
      }
    };

    getCameraPermission();
    
    // Cleanup function to stop the video stream
    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };
  }, [toast]);

  const handleCaptureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({ variant: "destructive", title: "Error", description: "Camera components are not ready." });
      return;
    }
    
    onProcessing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const photoDataUri = canvas.toDataURL("image/jpeg");

    try {
      // Step 1: Optimize resume to get text (same as optimizer)
      const optimizationResult = await optimizeResumeForAts({
        resumePdfDataUri: photoDataUri,
      });

      // Step 2: Create structured resume from optimized text
      const structuredResult: ResumeData = await createResume({
        resumeText: optimizationResult.optimizedResumeText,
      });

      // Step 3: Assign IDs for the editor
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
        description: "There was an error processing your resume photo. Please try again.",
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
                <Camera />
                Capture Resume Photo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-secondary rounded-lg overflow-hidden aspect-video flex items-center justify-center relative">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Loading State Overlay */}
                    {hasCameraPermission === null && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center text-muted-foreground">
                            <Loader2 className="h-10 w-10 animate-spin" />
                            <p className="mt-2 text-sm font-semibold">Requesting camera access...</p>
                        </div>
                    )}

                    {/* Error State Overlay */}
                    {hasCameraPermission === false && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-4 text-center text-destructive">
                            <CameraOff className="h-10 w-10" />
                            <p className="mt-2 font-bold">Camera Access Denied</p>
                            <p className="mt-1 text-xs">
                                Please enable camera permissions in your browser settings to use this feature.
                            </p>
                        </div>
                    )}
                </div>
                
                {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser to use this feature. You may need to refresh the page after granting permission.
                        </AlertDescription>
                    </Alert>
                )}

                <Button
                onClick={handleCaptureAndProcess}
                disabled={!hasCameraPermission || isProcessing}
                className="w-full"
                size="lg"
                >
                <Zap className="mr-2 h-4 w-4" />
                Capture & Process
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
