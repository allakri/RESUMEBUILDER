
"use client";

import { Award, CheckCircle2, Lightbulb, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function SuggestionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Column: Illustration */}
          <div className="hidden md:flex justify-center">
            <Image
              src="https://placehold.co/450x350.png"
              alt="Person reviewing a resume"
              width={450}
              height={350}
              data-ai-hint="woman reviewing document"
            />
          </div>

          {/* Right Column: Content */}
          <div className="space-y-8">
            <div className="text-left">
              <h1 className="text-4xl font-bold text-slate-800">
                You're off to a great start!
              </h1>
              <p className="mt-2 text-lg text-slate-600">
                Here's what you got right and some areas we'll help you improve.
              </p>
            </div>

            {/* "You got it right" Card */}
            <Card className="bg-slate-100/70 border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-xl font-semibold text-slate-700">
                  You got it right
                </CardTitle>
                <Award className="h-7 w-7 text-slate-500" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      You've included Contact, Work History, Education, Skills
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Great! You've added multiple ways for employers to get in
                      touch with you.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* "How we'll help you improve" Card */}
            <Card className="bg-slate-100/70 border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-xl font-semibold text-slate-700">
                  How we'll help you improve:
                </CardTitle>
                <Lightbulb className="h-7 w-7 text-slate-500" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Star className="h-6 w-6 text-amber-500 fill-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Add these sections: Professional Summary
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Star className="h-6 w-6 text-amber-500 fill-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Most employers seek specific section titles. We'll help
                      you create the ones they want.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Star className="h-6 w-6 text-amber-500 fill-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">
                      Enhance your Experience section with our pre-written
                      suggestions.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-lg py-7 px-12 rounded-full shadow-md transition-transform hover:scale-105"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
