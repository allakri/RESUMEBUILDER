
"use client";

import React, { useState, useMemo } from 'react';
import type { ResumeDataWithIds, ExperienceWithId, EducationWithId } from '@/ai/resume-schema';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import Image from 'next/image';
import { FileText, ChevronLeft, ChevronRight, Check, User, Briefcase, GraduationCap, Wrench, FileSignature, CheckCircle, Upload, Plus, Trash2, Palette, X } from 'lucide-react';
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
    { id: 'experience', title: 'Experience', icon: Briefcase },
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

    const isStepComplete = (stepId: WizardStepId) => {
        switch(stepId) {
            case 'heading':
                return resume.firstName && resume.lastName && resume.email;
            case 'experience':
                return resume.experience.length > 0;
            case 'education':
                return resume.education.length > 0;
            case 'skills':
                return resume.skills.length > 0;
            case 'summary':
                return !!resume.summary;
            default:
                return false;
        }
    }
    
    const renderStepContent = () => {
        switch (step) {
            case 'heading':
                return (
                    <div className="space-y-8">
                        <div>
                          <h1 className="text-3xl font-bold">Let’s start with your contact information</h1>
                          <p className="text-muted-foreground mt-1">This information will appear at the top of your resume.</p>
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
                    </div>
                );
            case 'experience':
                return <ExperienceStep resume={resume} onUpdate={handleUpdate} />;
            case 'education':
                return <EducationStep resume={resume} onUpdate={handleUpdate} />;
            case 'skills':
                return <SkillsStep resume={resume} onUpdate={handleUpdate} />;
            case 'summary':
                return <SummaryStep resume={resume} onUpdate={handleUpdate} />;
            case 'finalize':
                return <FinalizeStep />;
        }
    }

    return (
      <div className="flex h-screen bg-background">
        <aside className="w-[320px] bg-sidebar text-sidebar-foreground p-6 flex-col justify-between hidden md:flex">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <span className='text-2xl font-bold'>ResumeRevamp</span>
            </div>
            <nav>
              <ul className="space-y-2">
                {WIZARD_STEPS.map((s, index) => {
                  const isCompleted = index < currentStepIndex && isStepComplete(s.id);
                  const isCurrent = index === currentStepIndex;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => setStep(s.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-4 p-3 rounded-lg transition-colors duration-200",
                          isCurrent && "bg-primary/10 text-primary font-bold",
                          !isCurrent && "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                          index > currentStepIndex && "cursor-not-allowed opacity-60"
                        )}
                        disabled={index > currentStepIndex}
                      >
                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border-2 shrink-0",
                          isCurrent ? "bg-primary border-primary text-primary-foreground" : "border-sidebar-border",
                          isCompleted && "bg-green-500 border-green-500 text-white"
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
          <div className="text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ResumeRevamp.</p>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-muted/30">
          <div className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-2 bg-card p-8 rounded-2xl shadow-sm">
                {renderStepContent()}
              </div>
              <div className="hidden lg:block space-y-6">
                <Card className="sticky top-8 shadow-md">
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>This preview updates as you type.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[8.5/11] w-full bg-white rounded-md shadow-inner overflow-hidden border">
                      <ResumePreview 
                        resumeData={resume} 
                        templateName={selectedTemplate} 
                        className="!p-4 !text-xs scale-[0.9] origin-top"
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
          <div className="flex justify-between items-center p-4 border-t bg-card">
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
                                <span className="font-semibold text-sm">Color:</span>
                                {COLORS.map((color) => (
                                    <button
                                    key={color.name}
                                    onClick={() => setSelectedColor(color.value)}
                                    className={cn(
                                        "h-7 w-7 rounded-full border border-border transition-all focus:outline-none",
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
            <label htmlFor={name} className="block text-sm font-medium text-foreground mb-1">{label}</label>
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

const ExperienceStep = ({ resume, onUpdate }: { resume: ResumeDataWithIds, onUpdate: (fn: (d: ResumeDataWithIds) => void) => void }) => {
    const [editingExp, setEditingExp] = useState<ExperienceWithId | null>(null);

    const handleSave = () => {
        if (!editingExp) return;
        onUpdate(draft => {
            const index = draft.experience.findIndex(e => e.id === editingExp.id);
            if (index > -1) {
                draft.experience[index] = editingExp;
            } else {
                draft.experience.push(editingExp);
            }
        });
        setEditingExp(null);
    };

    const handleRemove = (id: string) => {
        onUpdate(draft => {
            draft.experience = draft.experience.filter(e => e.id !== id);
        });
    }

    const startNew = () => setEditingExp({ id: crypto.randomUUID(), title: '', company: '', location: '', dates: '', responsibilities: ['']});

    if (editingExp) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">{resume.experience.find(e => e.id === editingExp.id) ? 'Edit Experience' : 'Add New Experience'}</h2>
                <Input placeholder="Job Title" value={editingExp.title} onChange={e => setEditingExp({...editingExp, title: e.target.value})} />
                <Input placeholder="Company" value={editingExp.company} onChange={e => setEditingExp({...editingExp, company: e.target.value})} />
                <Input placeholder="Location" value={editingExp.location} onChange={e => setEditingExp({...editingExp, location: e.target.value})} />
                <Input placeholder="Dates (e.g., Jan 2020 - Present)" value={editingExp.dates} onChange={e => setEditingExp({...editingExp, dates: e.target.value})} />
                <Label>Responsibilities</Label>
                {editingExp.responsibilities.map((resp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <Input value={resp} onChange={e => {
                            const newResps = [...editingExp.responsibilities];
                            newResps[i] = e.target.value;
                            setEditingExp({...editingExp, responsibilities: newResps});
                        }} />
                        <Button variant="ghost" size="icon" onClick={() => {
                            const newResps = editingExp.responsibilities.filter((_, idx) => idx !== i);
                            setEditingExp({...editingExp, responsibilities: newResps});
                        }}><X className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditingExp({...editingExp, responsibilities: [...editingExp.responsibilities, '']})}>Add Responsibility</Button>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={() => setEditingExp(null)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Experience</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Tell us about your work experience</h1>
                <p className="text-muted-foreground mt-1">Start with your most recent job.</p>
            </div>
            {resume.experience.map(exp => (
                <Card key={exp.id} className="p-4 flex justify-between items-center">
                    <div>
                        <p className="font-bold">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingExp(exp)}>Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(exp.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </div>
                </Card>
            ))}
            <Button onClick={startNew} className="w-full" size="lg"><Plus className="mr-2 h-4 w-4" /> Add Experience</Button>
        </div>
    );
};

const EducationStep = ({ resume, onUpdate }: { resume: ResumeDataWithIds, onUpdate: (fn: (d: ResumeDataWithIds) => void) => void }) => {
    const [editingEdu, setEditingEdu] = useState<EducationWithId | null>(null);

    const handleSave = () => {
        if (!editingEdu) return;
        onUpdate(draft => {
            const index = draft.education.findIndex(e => e.id === editingEdu.id);
            if (index > -1) {
                draft.education[index] = editingEdu;
            } else {
                draft.education.push(editingEdu);
            }
        });
        setEditingEdu(null);
    };

    const handleRemove = (id: string) => {
        onUpdate(draft => {
            draft.education = draft.education.filter(e => e.id !== id);
        });
    }

    const startNew = () => setEditingEdu({ id: crypto.randomUUID(), degree: '', school: '', location: '', dates: '' });

    if (editingEdu) {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">{resume.education.find(e => e.id === editingEdu.id) ? 'Edit Education' : 'Add New Education'}</h2>
                <Input placeholder="Degree / Certificate" value={editingEdu.degree} onChange={e => setEditingEdu({...editingEdu, degree: e.target.value})} />
                <Input placeholder="School / Institution" value={editingEdu.school} onChange={e => setEditingEdu({...editingEdu, school: e.target.value})} />
                <Input placeholder="Location" value={editingEdu.location} onChange={e => setEditingEdu({...editingEdu, location: e.target.value})} />
                <Input placeholder="Dates (e.g., Aug 2016 - May 2020)" value={editingEdu.dates} onChange={e => setEditingEdu({...editingEdu, dates: e.target.value})} />
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={() => setEditingEdu(null)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Education</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">What is your educational background?</h1>
                <p className="text-muted-foreground mt-1">Include all relevant degrees and certifications.</p>
            </div>
            {resume.education.map(edu => (
                <Card key={edu.id} className="p-4 flex justify-between items-center">
                    <div>
                        <p className="font-bold">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.school}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingEdu(edu)}>Edit</Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(edu.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                    </div>
                </Card>
            ))}
            <Button onClick={startNew} className="w-full" size="lg"><Plus className="mr-2 h-4 w-4" /> Add Education</Button>
        </div>
    );
};

const SkillsStep = ({ resume, onUpdate }: { resume: ResumeDataWithIds, onUpdate: (fn: (d: ResumeDataWithIds) => void) => void }) => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Highlight your key skills</h1>
                <p className="text-muted-foreground mt-1">List your most important technical and soft skills. Separate them with commas.</p>
            </div>
            <Textarea 
                placeholder="e.g. React, TypeScript, Project Management, Public Speaking..."
                value={resume.skills.join(', ')}
                onChange={(e) => onUpdate(d => { d.skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                rows={8}
            />
        </div>
    );
};

const SummaryStep = ({ resume, onUpdate }: { resume: ResumeDataWithIds, onUpdate: (fn: (d: ResumeDataWithIds) => void) => void }) => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Write a professional summary</h1>
                <p className="text-muted-foreground mt-1">Briefly introduce yourself and highlight your top qualifications. This is your elevator pitch!</p>
            </div>
            <Textarea 
                placeholder="e.g. Highly motivated Software Engineer with 5+ years of experience in building and scaling web applications..."
                value={resume.summary}
                onChange={(e) => onUpdate(d => { d.summary = e.target.value })}
                rows={8}
            />
        </div>
    );
};

const FinalizeStep = () => {
    return (
        <div className="text-center h-full flex flex-col justify-center items-center">
            <div className="bg-green-100 p-6 rounded-full mb-6">
                <Check className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Your resume is ready!</h1>
            <p className="text-muted-foreground mt-2 max-w-md">You've successfully built your resume. Click the button below to proceed to the editor for final touches, AI enhancements, and downloading.</p>
        </div>
    );
};
