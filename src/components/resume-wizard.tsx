
"use client";

import React, { useState, useMemo } from 'react';
import type { ResumeDataWithIds } from '@/ai/resume-schema';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import Image from 'next/image';
import { FileText, ChevronLeft, ChevronRight, Check, User, Briefcase, GraduationCap, Wrench, FileSignature, CheckCircle, Upload, Plus, Trash2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumePreview } from './resume-preview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface ResumeWizardProps {
    initialResumeData: ResumeDataWithIds;
    onComplete: (data: ResumeDataWithIds) => void;
    onBack: () => void;
}

type WizardStepId = 'heading' | 'experience' | 'education' | 'skills' | 'summary' | 'finalize';

const WIZARD_STEPS: {id: WizardStepId, title: string, icon: React.ElementType}[] = [
    { id: 'heading', title: 'Heading', icon: User },
    { id: 'experience', title: 'Professional Experience', icon: Briefcase },
    { id: 'education', title: 'Education', icon: GraduationCap },
    { id: 'skills', title: 'Skills', icon: Wrench },
    { id: 'summary', title: 'Summary', icon: FileSignature },
    { id: 'finalize', title: 'Finalize', icon: Check },
];

const TEMPLATES = [
  { id: "modern", name: "Modern", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume professional" },
  { id: "creative", name: "Creative", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume modern" },
  { id: "professional", name: "Professional", recommended: true, imageUrl: "https://placehold.co/400x566.png", hint: "resume classic" },
];

const COLORS = [
  { name: "Royal Blue", value: "#4169E1", ring: "ring-blue-600" },
  { name: "Navy", value: "#1E3A8A", ring: "ring-blue-800" },
  { name: "Charcoal", value: "#374151", ring: "ring-gray-500" },
  { name: "Emerald", value: "#10B981", ring: "ring-emerald-500" },
  { name: "Crimson", value: "#DC2626", ring: "ring-red-600" },
];

export function ResumeWizard({ initialResumeData, onComplete, onBack }: ResumeWizardProps) {
    const [step, setStep] = useState<WizardStepId>('heading');
    const [resume, setResume] = useState<ResumeDataWithIds>(initialResumeData);

    const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
    const [showSuccess, setShowSuccess] = useState(false);
    
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [selectedColor, setSelectedColor] = useState(COLORS[0].value);

    const handleUpdate = (updater: (draft: ResumeDataWithIds) => void) => {
        const newResume = JSON.parse(JSON.stringify(resume));
        updater(newResume);
        setResume(newResume);
    };
    
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
                    <div className="space-y-8">
                        <div>
                          <h1 className="text-3xl font-bold text-gray-800">Let’s confirm your contact information</h1>
                          <p className="text-muted-foreground mt-1">This information will appear at the top of your resume.</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">Profile Photo</h3>
                                <p className="text-sm text-muted-foreground">Recommended. Must be a JPG or PNG file.</p>
                                <Button variant="outline" size="sm" className="mt-2">Upload Photo</Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <ValidatedInput label="First Name" name="firstName" value={resume.firstName} onChange={e => { handleUpdate(d => {d.firstName = e.target.value}); validateField('firstName', e.target.value)}} isValid={validatedFields.has('firstName')} />
                          <ValidatedInput label="Last Name" name="lastName" value={resume.lastName} onChange={e => { handleUpdate(d => {d.lastName = e.target.value}); validateField('lastName', e.target.value)}} isValid={validatedFields.has('lastName')} />
                          <ValidatedInput label="Profession" name="profession" value={resume.profession ?? ''} onChange={e => { handleUpdate(d => {d.profession = e.target.value}); validateField('profession', e.target.value)}} isValid={validatedFields.has('profession')} placeholder="e.g. Software Engineer"/>
                          <ValidatedInput label="City" name="city" value={resume.location?.split(',')[0] || ''} onChange={e => handleUpdate(d => { d.location = [e.target.value, d.location?.split(',')[1] || ''].filter(Boolean).join(', ') })} isValid={!!resume.location} />
                          <ValidatedInput label="Country" name="country" value={resume.location?.split(',')[1]?.trim() || ''} onChange={e => handleUpdate(d => { d.location = [d.location?.split(',')[0] || '', e.target.value].filter(Boolean).join(', ') })} isValid={!!resume.location} />
                          <ValidatedInput label="PIN Code" name="pinCode" value={resume.pinCode ?? ''} onChange={e => { handleUpdate(d => {d.pinCode = e.target.value}); validateField('pinCode', e.target.value)}} isValid={validatedFields.has('pinCode')} />
                          <ValidatedInput label="Phone Number" name="phone" value={resume.phone} type="tel" onChange={e => { handleUpdate(d => {d.phone = e.target.value}); validateField('phone', e.target.value)}} isValid={validatedFields.has('phone')} />
                          <ValidatedInput label="Email Address" name="email" value={resume.email} type="email" onChange={e => { handleUpdate(d => {d.email = e.target.value}); validateField('email', e.target.value)}} isValid={validatedFields.has('email')} />
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-3">Optional Links</h3>
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="linkedin-toggle" checked={!!resume.linkedIn} onCheckedChange={(checked) => handleUpdate(d => d.linkedIn = checked ? '' : undefined)} />
                                <Label htmlFor="linkedin-toggle">Add LinkedIn</Label>
                            </div>
                             {resume.linkedIn !== undefined && <ValidatedInput label="LinkedIn URL" name="linkedin" value={resume.linkedIn} onChange={e => handleUpdate(d => d.linkedIn = e.target.value)} isValid={!!resume.linkedIn} />}
                            
                            <div className="flex items-center space-x-2">
                                <Switch id="license-toggle" checked={!!resume.drivingLicense} onCheckedChange={(checked) => handleUpdate(d => d.drivingLicense = checked ? '' : undefined)} />
                                <Label htmlFor="license-toggle">Add Driving License</Label>
                            </div>
                            {resume.drivingLicense !== undefined && <ValidatedInput label="Driving License" name="license" value={resume.drivingLicense} onChange={e => handleUpdate(d => d.drivingLicense = e.target.value)} isValid={!!resume.drivingLicense} />}

                          </div>
                        </div>

                        {showSuccess && <Alert className="bg-emerald-50 border-emerald-200 mt-6">
                          <CheckCircle className="h-4 w-4 !text-emerald-600" />
                          <AlertTitle className="text-emerald-800 font-semibold">Success!</AlertTitle>
                          <AlertDescription className="text-emerald-700">Contact information saved.</AlertDescription>
                        </Alert>}
                    </div>
                );
            default: {
              const IconComponent = WIZARD_STEPS[currentStepIndex].icon;
              return (
                 <div className="flex flex-col items-center justify-center text-center h-full">
                    <div className="bg-primary/10 p-6 rounded-full mb-6">
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
        <aside className="w-[300px] bg-gray-900 text-white p-8 flex-col justify-between hidden md:flex">
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
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0",
                          isCurrent ? "bg-primary border-primary text-white" : "border-gray-600",
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
              <div className="hidden lg:block space-y-6">
                <Card className="sticky top-8">
                  <CardHeader>
                    <CardTitle>Resume Preview</CardTitle>
                    <CardDescription>This preview updates as you type.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[8.5/11] w-full bg-white rounded-md shadow-lg overflow-hidden border">
                      <ResumePreview 
                        resumeData={resume} 
                        templateName={selectedTemplate} 
                        className="!p-4 !text-xs"
                        style={{'--theme-color': selectedColor} as React.CSSProperties}
                      />
                    </div>
                    <Button variant="outline" className="w-full mt-4" onClick={() => setIsTemplateModalOpen(true)}>
                      <Palette className="mr-2 h-4 w-4" /> Change Template
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center p-6 border-t bg-white">
            <Button variant="outline" onClick={handlePrev} size="lg" className="px-8">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleNext} size="lg" className="px-8 bg-primary hover:bg-primary/90">
              {step === 'finalize' ? 'Finish & Go to Editor' : 'Continue'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>

        <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle>Change Template</DialogTitle>
                </DialogHeader>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
                    <div className="md:col-span-2 flex flex-col overflow-hidden">
                        <div className="p-6 border-b flex items-center gap-4">
                            <h3 className="text-lg font-semibold">Templates</h3>
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Color:</span>
                                {COLORS.map((color) => (
                                    <button
                                    key={color.name}
                                    onClick={() => setSelectedColor(color.value)}
                                    className={cn(
                                        "h-7 w-7 rounded-full border border-gray-300 transition-all focus:outline-none",
                                        selectedColor === color.value && `ring-2 ring-offset-2 ${color.ring}`
                                    )}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-muted/40 p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {TEMPLATES.map((template) => (
                                    <div key={template.id} className="group cursor-pointer" onClick={() => setSelectedTemplate(template.id)}>
                                        <Card className={cn(
                                            "relative w-full overflow-hidden border-2 rounded-lg transition-all duration-300",
                                            selectedTemplate === template.id ? 'border-primary' : 'border-border'
                                        )}>
                                            {template.recommended && <div className="absolute top-2 right-[-28px] w-[120px] transform rotate-45 bg-primary text-center text-white font-semibold py-0.5 z-10 text-xs shadow-md">RECOMMENDED</div>}
                                            <div className="aspect-[8.5/11] bg-white">
                                                <Image src={template.imageUrl} alt={template.name} width={400} height={566} className="w-full h-full object-cover" data-ai-hint={template.hint} />
                                            </div>
                                        </Card>
                                        <h4 className="text-center font-semibold mt-2">{template.name}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col border-l">
                         <h3 className="text-lg font-semibold p-6 border-b">Live Preview</h3>
                         <div className="flex-1 overflow-y-auto bg-muted/40 p-6">
                            <div className="aspect-[8.5/11] w-full bg-white rounded-md shadow-lg overflow-hidden border scale-90 origin-top">
                                <ResumePreview resumeData={resume} templateName={selectedTemplate} style={{'--theme-color': selectedColor} as React.CSSProperties} />
                            </div>
                         </div>
                    </div>
                </div>
                <DialogFooter className="p-6 border-t bg-background">
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={() => setIsTemplateModalOpen(false)}>Select Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    );
}

const ValidatedInput = ({ label, name, value, onChange, isValid, placeholder, type = "text" }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isValid: boolean, placeholder?: string, type?: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative w-full">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <Input id={name} name={name} value={value} onChange={onChange} placeholder={placeholder} type={type} className={cn("pr-10", isValid ? "border-green-500 focus-visible:ring-green-500" : "")} />
            {isValid && <CheckCircle className="absolute right-3 top-[calc(50%_-_2px)] h-5 w-5 text-green-500" />}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label} for your resume heading.</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
