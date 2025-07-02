
"use client";

import React, { useState } from 'react';
import type { ResumeDataWithIds } from '@/ai/resume-schema';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { FileText, ChevronLeft, ChevronRight, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumePreview } from './resume-preview';

// Replicating CustomInput and CustomTextarea from resume-editor.tsx for use here.
const CustomInput = React.forwardRef<HTMLInputElement, {label?:string} & React.ComponentProps<typeof Input>>(({ className, type, label, ...props }, ref) => {
    const id = React.useId();
    if (!label) return <Input type={type} className={className} ref={ref} {...props}/>
    return (
        <div className="grid w-full items-center gap-1.5">
            <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
            <Input id={id} type={type} className={cn("bg-white text-black", className)} ref={ref} {...props} />
        </div>
    );
});
CustomInput.displayName = "Input";

const CustomTextarea = React.forwardRef<HTMLTextAreaElement, {label?: string} & React.ComponentProps<typeof Textarea>>(({ className, label, ...props }, ref) => {
    const id = React.useId();
    if (!label) return <Textarea className={cn("bg-white text-black", className)} ref={ref} {...props} />
    return (
      <div className="grid w-full gap-1.5">
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>
        <Textarea id={id} className={cn("bg-white text-black", className)} ref={ref} {...props} />
      </div>
    )
});
CustomTextarea.displayName = "Textarea";


interface ResumeWizardProps {
    initialResumeData: ResumeDataWithIds;
    onComplete: (data: ResumeDataWithIds) => void;
    onBack: () => void;
}

type WizardStep = 'heading' | 'experience' | 'education' | 'skills' | 'summary' | 'finalize';

const WIZARD_STEPS: {id: WizardStep, title: string}[] = [
    { id: 'heading', title: 'Heading' },
    { id: 'experience', title: 'Work Experience' },
    { id: 'education', title: 'Education' },
    { id: 'skills', title: 'Skills' },
    { id: 'summary', title: 'Summary' },
    { id: 'finalize', title: 'Finalize' },
];

export function ResumeWizard({ initialResumeData, onComplete, onBack }: ResumeWizardProps) {
    const [step, setStep] = useState<WizardStep>('heading');
    const [resume, setResume] = useState<ResumeDataWithIds>(initialResumeData);
    const [themeColor] = useState('#4169e1'); // Royal Blue

    const handleUpdate = (updater: (draft: ResumeDataWithIds) => void) => {
        const newResume = JSON.parse(JSON.stringify(resume));
        updater(newResume);
        setResume(newResume);
    };

    const handleNext = () => {
        const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === step);
        if (currentStepIndex < WIZARD_STEPS.length - 1) {
            setStep(WIZARD_STEPS[currentStepIndex + 1].id);
        } else {
            onComplete(resume);
        }
    };
    
    const handlePrev = () => {
        const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === step);
        if (currentStepIndex > 0) {
            setStep(WIZARD_STEPS[currentStepIndex - 1].id);
        } else {
            onBack();
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 'heading':
                return (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-2xl font-bold">What's the best way for employers to contact you?</h2>
                        <p className="text-muted-foreground">We suggest including an email and phone number.</p>
                        <CustomInput label="Full Name" value={resume.name} onChange={(e) => handleUpdate(draft => { draft.name = e.target.value })} />
                        <CustomInput label="Email Address" type="email" value={resume.email} onChange={(e) => handleUpdate(draft => { draft.email = e.target.value })} />
                        <CustomInput label="Phone Number" value={resume.phone} onChange={(e) => handleUpdate(draft => { draft.phone = e.target.value })} />
                        <CustomInput label="Location (e.g. City, Country)" value={resume.location ?? ""} onChange={(e) => handleUpdate(draft => { draft.location = e.target.value })} />
                    </div>
                );
            case 'experience':
                return (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-2xl font-bold">Tell us about your most recent job.</h2>
                        <p className="text-muted-foreground">You can add more positions later in the main editor.</p>
                        {resume.experience.map((exp, expIndex) => (
                             <Card key={exp.id} className="p-4 space-y-4 bg-slate-50">
                                 <CustomInput label="Job Title" value={exp.title} onChange={(e) => handleUpdate(draft => { draft.experience[expIndex].title = e.target.value })} />
                                 <CustomInput label="Company" value={exp.company} onChange={(e) => handleUpdate(draft => { draft.experience[expIndex].company = e.target.value })} />
                                 <CustomInput label="Location" value={exp.location} onChange={(e) => handleUpdate(draft => { draft.experience[expIndex].location = e.target.value })} />
                                 <CustomInput label="Dates" value={exp.dates} onChange={(e) => handleUpdate(draft => { draft.experience[expIndex].dates = e.target.value })} />
                                 <label className="block text-sm font-medium">Responsibilities</label>
                                 {exp.responsibilities.map((resp, respIndex) => (
                                     <div key={respIndex} className="flex items-center gap-2">
                                         <Textarea value={resp} onChange={(e) => handleUpdate(draft => { draft.experience[expIndex].responsibilities[respIndex] = e.target.value })} rows={2} className="bg-white text-black" />
                                         <Button variant="ghost" size="icon" onClick={() => handleUpdate(draft => { draft.experience[expIndex].responsibilities.splice(respIndex, 1) })}><Trash2 className="h-4 w-4" /></Button>
                                     </div>
                                 ))}
                                 <Button variant="outline" size="sm" onClick={() => handleUpdate(draft => { draft.experience[expIndex].responsibilities.push("") })}><PlusCircle className="mr-2 h-4 w-4"/> Add Responsibility</Button>
                             </Card>
                        ))}
                         {resume.experience.length === 0 && (
                            <Button variant="outline" onClick={() => handleUpdate(draft => { draft.experience.push({ id: crypto.randomUUID(), title: "", company: "", location: "", dates: "", responsibilities: [""] }) })}>
                                Add Experience
                            </Button>
                        )}
                    </div>
                );
            case 'education':
                 return (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-2xl font-bold">What is your education?</h2>
                        <p className="text-muted-foreground">Include your most recent qualification. You can add more later.</p>
                         {resume.education.map((edu, eduIndex) => (
                             <Card key={edu.id} className="p-4 space-y-4 bg-slate-50">
                                 <CustomInput label="Degree / Certificate" value={edu.degree} onChange={(e) => handleUpdate(draft => { draft.education[eduIndex].degree = e.target.value })} />
                                 <CustomInput label="School / Institution" value={edu.school} onChange={(e) => handleUpdate(draft => { draft.education[eduIndex].school = e.target.value })} />
                                 <CustomInput label="Location" value={edu.location} onChange={(e) => handleUpdate(draft => { draft.education[eduIndex].location = e.target.value })} />
                                 <CustomInput label="Dates" value={edu.dates} onChange={(e) => handleUpdate(draft => { draft.education[eduIndex].dates = e.target.value })} />
                             </Card>
                        ))}
                         {resume.education.length === 0 && (
                            <Button variant="outline" onClick={() => handleUpdate(draft => { draft.education.push({ id: crypto.randomUUID(), degree: "", school: "", location: "", dates: "" }) })}>
                                Add Education
                            </Button>
                        )}
                    </div>
                );
            case 'skills':
                return (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-2xl font-bold">What skills do you have?</h2>
                        <p className="text-muted-foreground">List skills relevant to the job you are applying for. Separate them with commas.</p>
                        <CustomTextarea label="Skills" value={(resume.skills || []).join(', ')} onChange={(e) => handleUpdate(draft => { draft.skills = e.target.value.split(',').map(s => s.trim())})} rows={6} placeholder="e.g. React, Project Management, Graphic Design" />
                    </div>
                );
            case 'summary':
                return (
                    <div className="space-y-6 max-w-2xl">
                        <h2 className="text-2xl font-bold">Write a professional summary.</h2>
                        <p className="text-muted-foreground">Briefly introduce yourself and highlight your top qualifications. This is your elevator pitch!</p>
                        <CustomTextarea label="Summary" value={resume.summary} onChange={(e) => handleUpdate(draft => { draft.summary = e.target.value })} rows={6} />
                    </div>
                );
            case 'finalize':
                return (
                     <div className='flex flex-col h-full items-center'>
                         <h2 className="text-2xl font-bold mb-4 text-center">Here's your resume so far!</h2>
                         <p className="text-muted-foreground mb-8 text-center">You can make more detailed edits on the next screen.</p>
                         <div className='w-full max-w-[8.5in] scale-90 md:scale-100 transform md:transform-none origin-top'>
                             <ResumePreview 
                                resumeData={resume} 
                                templateName="modern"
                                className="shadow-lg"
                                style={{ "--theme-color": themeColor } as React.CSSProperties}
                             />
                         </div>
                     </div>
                );
        }
    }

    return (
        <div className="flex h-screen bg-slate-100 text-slate-900">
            <aside className="w-64 bg-[#1e3a8a] text-white p-6 flex-col justify-between hidden md:flex">
                <div>
                    <div className="mb-10 flex items-center gap-2">
                        <FileText className="h-8 w-8 text-slate-300" />
                        <span className='text-xl font-bold text-slate-200'>ResumeRevamp</span>
                    </div>
                    <nav className="flex flex-col space-y-2">
                        {WIZARD_STEPS.map((s, index) => {
                            const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === step);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setStep(s.id)}
                                    disabled={index > currentStepIndex + 1 && s.id !== 'finalize'}
                                    className={cn(
                                        "text-left text-lg p-3 rounded-md transition-colors w-full",
                                        step === s.id 
                                            ? "bg-white/20 font-bold" 
                                            : "hover:bg-white/10 text-slate-300",
                                        index > currentStepIndex + 1 && s.id !== 'finalize' && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {s.title}
                                </button>
                            )
                        })}
                    </nav>
                </div>
                <div className="text-xs text-slate-400">
                     <p>&copy; {new Date().getFullYear()} ResumeRevamp.</p>
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-12 flex flex-col overflow-y-auto">
                <div className="flex-grow">
                    {renderStepContent()}
                </div>
                 <div className="mt-auto flex justify-between items-center pt-8 border-t">
                    <Button variant="outline" onClick={handlePrev} size="lg">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={handleNext} size="lg">
                         {step === 'finalize' ? 'Finish & Go to Editor' : 'Continue'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </main>
        </div>
    );
}
