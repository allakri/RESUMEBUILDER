"use client";

import { Award, FileText } from "lucide-react";
import { AtsScorecard } from "@/components/ats-scorecard";
import { ResumeOptimizer } from "@/components/resume-optimizer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-primary tracking-tight">
          ResumeRevamp
        </h1>
        <p className="mt-2 text-lg text-foreground/80 max-w-2xl mx-auto">
          Elevate your resume. Get past the bots. Land your dream job.
        </p>
      </header>
      <main className="w-full max-w-4xl">
        <Tabs defaultValue="optimizer" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="optimizer">
              <FileText className="mr-2 h-4 w-4" />
              ATS Optimizer
            </TabsTrigger>
            <TabsTrigger value="scorecard">
              <Award className="mr-2 h-4 w-4" />
              ATS Scorecard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="optimizer">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Resume Optimizer</CardTitle>
                <CardDescription>
                  Upload your resume in PDF format to get an ATS-friendly
                  version.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResumeOptimizer />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="scorecard">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">ATS Scorecard</CardTitle>
                <CardDescription>
                  Get a score on how well your resume matches a job description.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AtsScorecard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} ResumeRevamp. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
