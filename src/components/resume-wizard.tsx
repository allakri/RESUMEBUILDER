
"use client";

import React, { useState, useMemo } from 'react';
import type { ResumeDataWithIds } from '@/ai/resume-schema';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { FileText, ChevronLeft, ChevronRight, CheckCircle, User, Briefcase, GraduationCap, Wrench, FileSignature, Check, Link as LinkIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumePreview } from './resume-preview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface ResumeWizardProps {
    initialResumeData: ResumeDataWithIds;
    onComplete: (data: ResumeDataWithIds) => void;
    onBack: () => void;
}

type WizardStepId = 'heading' | 'experience' | 'education' | 'skills' | 'summary' | 'finalize';

const WIZARD_STEPS: {id: WizardStepId, title: string, icon: React.ElementType}[] = [
    { id: 'heading', title: 'Heading', icon: User },
    { id: 'experience', title: 'Experience', icon: Briefcase },
    { id: 'education', title: 'Education', icon: GraduationCap },
    { id: 'skills', title: 'Skills', icon: Wrench },
    { id: 'summary', title: 'Summary', icon: FileSignature },
    { id: 'finalize', title: 'Finalize', icon: Check },
];

export function ResumeWizard({ initialResumeData, onComplete, onBack }: ResumeWizardProps) {
    const [step, setStep] = useState<WizardStepId>('heading');
    const [resume, setResume] = useState<ResumeDataWithIds>(initialResumeData);

    // Local state for composite fields
    const [city, setCity] = useState(resume.location?.split(',')[0] || '');
    const [country, setCountry] = useState(resume.location?.split(',')[1]?.trim() || '');

    const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
    const [showSuccess, setShowSuccess] = useState(false);

    const handleUpdate = (updater: (draft: ResumeDataWithIds) => void) => {
        const newResume = JSON.parse(JSON.stringify(resume));
        updater(newResume);
        setResume(newResume);
    };

    const handleLocationChange = (newCity: string, newCountry: string) => {
        setCity(newCity);
        setCountry(newCountry);
        const newLocation = [newCity, newCountry].filter(Boolean).join(', ');
        handleUpdate(draft => { draft.location = newLocation; });
        validateField('location', newLocation);
    }
    
    const validateField = (fieldName: string, value: string) => {
      setValidatedFields(prev => {
        const newSet = new Set(prev);
        if (value && value.trim() !== '') {
          newSet.add(fieldName);
        } else {
          newSet.delete(fieldName);
        }
        return newSet;
      });
    };

    const currentStepIndex = useMemo(() => WIZARD_STEPS.findIndex(s => s.id === step), [step]);

    const handleNext = () => {
        if (currentStepIndex < WIZARD_STEPS.length - 1) {
            setStep(WIZARD_STEPS[currentStepIndex + 1].id);
            if (currentStepIndex === 0) {
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            }
        } else {
            onComplete(resume);
        }
    };
    
    const handlePrev = () => {
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
                    <div className="space-y-6">
                        <CardHeader className="p-0">
                          <CardTitle className="text-3xl font-bold text-gray-800">Contact Information</CardTitle>
                          <CardDescription>This information will appear at the top of your resume.</CardDescription>
                        </CardHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <ValidatedInput label="Full Name" name="name" value={resume.name} onChange={e => { handleUpdate(d => {d.name = e.target.value}); validateField('name', e.target.value)}} isValid={validatedFields.has('name')} />
                          <ValidatedInput label="Profession" name="profession" value={resume.profession ?? ''} onChange={e => { handleUpdate(d => {d.profession = e.target.value}); validateField('profession', e.target.value)}} isValid={validatedFields.has('profession')} placeholder="e.g. Software Engineer"/>
                          <ValidatedInput label="Phone" name="phone" value={resume.phone} type="tel" onChange={e => { handleUpdate(d => {d.phone = e.target.value}); validateField('phone', e.target.value)}} isValid={validatedFields.has('phone')} />
                          <ValidatedInput label="Email" name="email" value={resume.email} type="email" onChange={e => { handleUpdate(d => {d.email = e.target.value}); validateField('email', e.target.value)}} isValid={validatedFields.has('email')} />
                          <ValidatedInput label="City" name="city" value={city} onChange={e => handleLocationChange(e.target.value, country)} isValid={validatedFields.has('location')} />
                          <ValidatedInput label="Country" name="country" value={country} onChange={e => handleLocationChange(city, e.target.value)} isValid={validatedFields.has('location')} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-3">Social Links (Optional)</h3>
                          <div className="space-y-3">
                            {(resume.websites ?? []).map((site, index) => (
                              <div key={site.id} className="flex items-center gap-2">
                                <Input placeholder="Link Name (e.g. LinkedIn)" value={site.name} onChange={e => handleUpdate(d => {d.websites![index].name = e.target.value})} className="w-1/3" />
                                <Input placeholder="URL" value={site.url} onChange={e => handleUpdate(d => {d.websites![index].url = e.target.value})} />
                                <Button variant="ghost" size="icon" onClick={() => handleUpdate(d => { d.websites!.splice(index, 1); })}><Trash2 className="h-4 w-4 text-gray-500" /></Button>
                              </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => handleUpdate(d => { if(!d.websites) d.websites = []; d.websites.push({id: crypto.randomUUID(), name: '', url: ''})})}><PlusCircle className="mr-2 h-4 w-4" /> Add Link</Button>
                          </div>
                        </div>
                        {showSuccess && <Alert className="bg-emerald-50 border-emerald-200">
                          <CheckCircle className="h-4 w-4 !text-emerald-600" />
                          <AlertTitle className="text-emerald-800 font-semibold">Success!</AlertTitle>
                          <AlertDescription className="text-emerald-700">Contact information saved.</AlertDescription>
                        </Alert>}
                    </div>
                );
            // Other steps would be built out similarly...
            default: {
              const IconComponent = WIZARD_STEPS[currentStepIndex].icon;
              return (
                 <div className="flex flex-col items-center justify-center text-center h-full">
                    <div className="bg-indigo-100 p-6 rounded-full mb-6">
                        <IconComponent className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">This is the {WIZARD_STEPS[currentStepIndex].title} step.</h2>
                    <p className="text-muted-foreground mt-2 max-w-md">The UI for this step hasn't been built yet, but you can navigate to it. Click "Continue" to proceed to the editor.</p>
                </div>
              );
            }
        }
    }

    return (
        <div className="flex h-screen bg-white">
            {/* Left Sidebar */}
            <aside className="w-80 bg-gray-900 text-white p-8 flex-col justify-between hidden md:flex">
                <div>
                    <div className="mb-12 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-white" />
                        <span className='text-2xl font-bold'>ResumeRevamp</span>
                    </div>
                    <nav>
                      <ul className="space-y-2">
                        {WIZARD_STEPS.map((s, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            return (
                              <li key={s.id}>
                                <button
                                  onClick={() => index < currentStepIndex && setStep(s.id)}
                                  className={cn(
                                      "w-full text-left flex items-center gap-4 p-3 rounded-lg transition-colors duration-200",
                                      isCurrent && "bg-white/10 font-bold",
                                      !isCurrent && "text-gray-400 hover:bg-white/5 hover:text-white",
                                      index > currentStepIndex && "cursor-not-allowed opacity-50"
                                  )}
                                  disabled={index > currentStepIndex}
                                >
                                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border-2",
                                    isCurrent ? "bg-white text-gray-900 border-white" : "border-gray-600",
                                    isCompleted && "bg-emerald-500 border-emerald-500 text-white"
                                  )}>
                                    {isCompleted ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                                  </div>
                                  <span className="text-lg">{s.title}</span>
                                </button>
                              </li>
                            )
                        })}
                      </ul>
                    </nav>
                </div>
                 <div className="text-xs text-gray-500">
                     <p>&copy; {new Date().getFullYear()} ResumeRevamp.</p>
                </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 flex flex-col">
              <div className="flex-grow p-6 sm:p-8 md:p-12 overflow-y-auto bg-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2">
                    {renderStepContent()}
                  </div>
                  <div className="hidden lg:block">
                     <Card className="sticky top-8">
                       <CardHeader>
                          <CardTitle>Resume Preview</CardTitle>
                          <CardDescription>This preview updates as you type.</CardDescription>
                       </CardHeader>
                       <CardContent>
                          <div className="aspect-[8.5/11] w-full bg-white rounded-md shadow-lg overflow-hidden scale-100">
                             <ResumePreview resumeData={resume} templateName="modern" className="!p-4 !text-xs"/>
                          </div>
                       </CardContent>
                     </Card>
                  </div>
                </div>
              </div>
              {/* Footer Navigation */}
              <div className="mt-auto flex justify-between items-center p-6 border-t bg-white">
                  <Button variant="outline" onClick={handlePrev} size="lg" className="px-8">
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                  </Button>
                  <Button onClick={handleNext} size="lg" className="px-8 bg-indigo-600 hover:bg-indigo-700">
                       {step === 'finalize' ? 'Finish & Go to Editor' : 'Continue'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
              </div>
            </main>
        </div>
    );
}


// A helper component for validated input fields
const ValidatedInput = ({ label, name, value, onChange, isValid, placeholder, type = "text" }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isValid: boolean, placeholder?: string, type?: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
            <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <Input id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} type={type} className={cn("pr-10", isValid ? "border-emerald-500 focus-visible:ring-emerald-500" : "")} />
            {isValid && <CheckCircle className="absolute right-3 top-9 h-5 w-5 text-emerald-500" />}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>This field will be used in your resume's heading.</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
