
"use client";

import React, { useState, useMemo } from 'react';
import type { ResumeDataWithIds, ExperienceWithId, EducationWithId, CustomSectionWithId } from '@/ai/resume-schema';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Image from 'next/image';
import { FileText, ChevronLeft, ChevronRight, Check, User, Briefcase, GraduationCap, Wrench, FileSignature, CheckCircle, Plus, Trash2, Palette, X, PlusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumePreview } from './resume-preview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';

interface ResumeWizardProps {
    initialResumeData: ResumeDataWithIds;
    onComplete: (data: {resume: ResumeDataWithIds, template: string, color: string}) => void;
    onBack: () => void;
}

type WizardStepId = 'heading' | 'experience' | 'education' | 'skills' | 'summary' | 'custom' | 'finalize';

const WIZARD_STEPS: {id: WizardStepId, title: string, icon: React.ElementType}[] = [
    { id: 'heading', title: 'Heading', icon: User },
    { id: 'experience', title: 'Experience', icon: Briefcase },
    { id: 'education', title: 'Education', icon: GraduationCap },
    { id: 'skills', title: 'Skills', icon: Wrench },
    { id: 'summary', title: 'Summary', icon: FileSignature },
    { id: 'custom', title: 'Custom', icon: PlusSquare },
    { id: 'finalize', title: 'Finalize', icon: Check },
];

const TEMPLATES = [
  { id: "professional", name: "Professional", imageUrl: "https://placehold.co/400x566.png", hint: "resume professional" },
  { id: "modern", name: "Modern", imageUrl: "https://placehold.co/400x566.png", hint: "resume modern" },
  { id: "creative", name: "Creative", imageUrl: "https://placehold.co/400x566.png", hint: "resume creative" },
  { id: "classic", name: "Classic", imageUrl: "https://placehold.co/400x566.png", hint: "resume classic" },
  { id: "minimalist", name: "Minimalist", imageUrl: "https://placehold.co/400x566.png", hint: "resume minimalist" },
  { id: "executive", name: "Executive", imageUrl: "https://placehold.co/400x566.png", hint: "resume executive" },
];

const COLORS = [
  { name: "Royal Blue", value: "#4169E1", ring: "ring-blue-600" },
  { name: "Navy", value: "#1E3A8A", ring: "ring-blue-800" },
  { name: "Charcoal", value: "#374151", ring: "ring-gray-500" },
  { name: "Emerald", value: "#10B981", ring: "ring-emerald-500" },
  { name: "Crimson", value: "#DC2626", ring: "ring-red-600" },
];

const DUMMY_RESUME_DATA: ResumeDataWithIds = {
    firstName: "Alex", lastName: "Doe", profession: "Product Designer",
    email: "alex.doe@example.com", phone: "123-456-7890", location: "San Francisco, CA", pinCode: "94107",
    summary: "Creative Product Designer with 5+ years of experience in delivering user-centric solutions for web and mobile. Proficient in all stages of the design process, from user research to high-fidelity prototyping.",
    experience: [{ id: 'exp1', title: 'Senior Product Designer', company: 'Innovate Inc.', location: 'Palo Alto, CA', dates: '2020 - Present', responsibilities: ['Led the redesign of the main dashboard, improving user engagement by 25%.', 'Collaborated with cross-functional teams to define product requirements.'] }],
    education: [{ id: 'edu1', degree: 'B.S. in Human-Computer Interaction', school: 'Stanford University', location: 'Stanford, CA', dates: '2012 - 2016' }],
    skills: ["UI/UX Design", "Figma", "Sketch", "Prototyping", "User Research", "Design Systems"],
    websites: [{id: 'web1', name: 'Portfolio', url: 'https://example.com'}],
    projects: [], achievements: [], hobbies: [], customSections: []
}


export function ResumeWizard({ initialResumeData, onComplete, onBack }: ResumeWizardProps) {
    const [step, setStep] = useState<WizardStepId>('heading');
    const [resume, setResume] = useState<ResumeDataWithIds>(initialResumeData);

    const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());
    
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
            onComplete({ resume, template: selectedTemplate, color: selectedColor });
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
                return !!(resume.firstName && resume.lastName && resume.email);
            case 'experience':
                return resume.experience.length > 0;
            case 'education':
                return resume.education.length > 0;
            case 'skills':
                return resume.skills.length > 0;
            case 'summary':
                return !!resume.summary;
            case 'custom':
                return true; // This step is optional
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
            case 'custom':
                return <CustomSectionsStep resume={resume} onUpdate={handleUpdate} />;
            case 'finalize':
                return <FinalizeStep 
                            resume={resume} 
                            selectedTemplate={selectedTemplate}
                            setSelectedTemplate={setSelectedTemplate}
                            selectedColor={selectedColor}
                            setSelectedColor={setSelectedColor}
                        />;
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
             {renderStepContent()}
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
            <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">{resume.experience.find(e => e.id === editingExp.id) ? 'Edit Experience' : 'Add New Experience'}</h2>
                <div className="space-y-4">
                    <Input placeholder="Job Title" value={editingExp.title} onChange={e => setEditingExp({...editingExp, title: e.target.value})} />
                    <Input placeholder="Company" value={editingExp.company} onChange={e => setEditingExp({...editingExp, company: e.target.value})} />
                    <Input placeholder="Location" value={editingExp.location} onChange={e => setEditingExp({...editingExp, location: e.target.value})} />
                    <Input placeholder="Dates (e.g., Jan 2020 - Present)" value={editingExp.dates} onChange={e => setEditingExp({...editingExp, dates: e.target.value})} />
                    <Label>Responsibilities</Label>
                    {editingExp.responsibilities.map((resp, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <Textarea value={resp} rows={2} onChange={e => {
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
            </Card>
        )
    }

    return (
        <Card className="p-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Tell us about your work experience</h1>
                    <p className="text-muted-foreground mt-1">Start with your most recent job.</p>
                </div>
                {resume.experience.map(exp => (
                    <Card key={exp.id} className="p-4 flex justify-between items-center bg-muted/40">
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
        </Card>
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
             <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">{resume.education.find(e => e.id === editingEdu.id) ? 'Edit Education' : 'Add New Education'}</h2>
                <div className="space-y-4">
                    <Input placeholder="Degree / Certificate" value={editingEdu.degree} onChange={e => setEditingEdu({...editingEdu, degree: e.target.value})} />
                    <Input placeholder="School / Institution" value={editingEdu.school} onChange={e => setEditingEdu({...editingEdu, school: e.target.value})} />
                    <Input placeholder="Location" value={editingEdu.location} onChange={e => setEditingEdu({...editingEdu, location: e.target.value})} />
                    <Input placeholder="Dates (e.g., Aug 2016 - May 2020)" value={editingEdu.dates} onChange={e => setEditingEdu({...editingEdu, dates: e.target.value})} />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setEditingEdu(null)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Education</Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">What is your educational background?</h1>
                    <p className="text-muted-foreground mt-1">Include all relevant degrees and certifications.</p>
                </div>
                {resume.education.map(edu => (
                    <Card key={edu.id} className="p-4 flex justify-between items-center bg-muted/40">
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
        </Card>
    );
};

const SkillsStep = ({ resume, onUpdate }: { resume: ResumeDataWithIds, onUpdate: (fn: (d: ResumeDataWithIds) => void) => void }) => {
    const [currentSkill, setCurrentSkill] = useState('');

    const handleAddSkill = () => {
        if (currentSkill.trim() && !resume.skills.includes(currentSkill.trim())) {
            onUpdate(d => {
                d.skills.push(currentSkill.trim());
            });
            setCurrentSkill('');
        } else {
            setCurrentSkill('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        onUpdate(d => {
            d.skills = d.skills.filter(skill => skill !== skillToRemove);
        });
    };

    return (
        <Card className="p-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Highlight your key skills</h1>
                    <p className="text-muted-foreground mt-1">Add your most important skills one by one. Press Enter or click "Add" to add a skill.</p>
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="e.g. React"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyDown={handleKeyDown}
                        aria-label="Add a new skill"
                    />
                    <Button onClick={handleAddSkill}>Add Skill</Button>
                </div>
                <Card className="p-4 bg-muted/40 min-h-[150px]">
                    <CardContent className="p-0">
                        <div className="flex flex-wrap gap-2">
                            {resume.skills.length === 0 ? (
                                <p className="text-sm text-muted-foreground w-full text-center py-10">No skills added yet.</p>
                            ) : (
                                resume.skills.map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-base py-1 px-3 flex items-center gap-2">
                                        {skill}
                                        <button onClick={() => handleRemoveSkill(skill)} className="rounded-full hover:bg-muted-foreground/20 p-0.5" aria-label={`Remove ${skill}`}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Card>
    );
};

const SummaryStep = ({ resume, onUpdate }: { resume: ResumeDataWithIds, onUpdate: (fn: (d: ResumeDataWithIds) => void) => void }) => {
    return (
        <Card className="p-8">
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
        </Card>
    );
};

const CustomSectionsStep = ({ resume, onUpdate }: { resume: ResumeDataWithIds, onUpdate: (fn: (d: ResumeDataWithIds) => void) => void }) => {
    const [editingSection, setEditingSection] = useState<CustomSectionWithId | null>(null);

    const handleSave = () => {
        if (!editingSection) return;
        onUpdate(draft => {
            if (!draft.customSections) draft.customSections = [];
            const index = draft.customSections.findIndex(s => s.id === editingSection.id);
            if (index > -1) {
                draft.customSections[index] = editingSection;
            } else {
                draft.customSections.push(editingSection);
            }
        });
        setEditingSection(null);
    };

    const handleRemove = (id: string) => {
        onUpdate(draft => {
            draft.customSections = (draft.customSections || []).filter(s => s.id !== id);
        });
    }

    const startNew = () => setEditingSection({ id: crypto.randomUUID(), title: '', content: '' });

    if (editingSection) {
        return (
            <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">{resume.customSections?.find(s => s.id === editingSection.id) ? 'Edit Section' : 'Add New Section'}</h2>
                <div className="space-y-4">
                    <Input
                        placeholder="Section Title (e.g., Certifications, Languages)"
                        value={editingSection.title}
                        onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                    />
                    <Textarea
                        placeholder="Content for this section..."
                        value={editingSection.content}
                        onChange={e => setEditingSection({ ...editingSection, content: e.target.value })}
                        rows={6}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setEditingSection(null)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Section</Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Have anything else to add?</h1>
                    <p className="text-muted-foreground mt-1">Add custom sections like certifications, languages, or publications.</p>
                </div>
                {(resume.customSections || []).map(sec => (
                    <Card key={sec.id} className="p-4 flex justify-between items-center bg-muted/40">
                        <div>
                            <p className="font-bold">{sec.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{sec.content}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingSection(sec)}>Edit</Button>
                            <Button variant="ghost" size="icon" onClick={() => handleRemove(sec.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </div>
                    </Card>
                ))}
                <Button onClick={startNew} className="w-full" size="lg"><Plus className="mr-2 h-4 w-4" /> Add Custom Section</Button>
            </div>
        </Card>
    );
};

const FinalizeStep = ({ resume, selectedTemplate, setSelectedTemplate, selectedColor, setSelectedColor }: {
    resume: ResumeDataWithIds;
    selectedTemplate: string;
    setSelectedTemplate: (t: string) => void;
    selectedColor: string;
    setSelectedColor: (c: string) => void;
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-bold">Choose your style</h1>
                <p className="text-muted-foreground -mt-2">Your resume is complete! Pick a template and color to make it stand out. This will be applied in the editor.</p>
                <Card className="flex-1 shadow-lg">
                    <div className="aspect-[8.5/11] w-full bg-white rounded-md shadow-inner overflow-hidden border">
                       <ResumePreview 
                           key={`${selectedTemplate}-${selectedColor}`}
                           resumeData={resume} 
                           templateName={selectedTemplate}
                           className="scale-[0.9] origin-top"
                           style={{'--theme-color': selectedColor} as React.CSSProperties}
                       />
                    </div>
                </Card>
            </div>
            <div className="flex flex-col gap-4">
                <Card className="p-4">
                    <h3 className="font-semibold mb-3">Color Scheme</h3>
                    <div className="flex items-center gap-3">
                        {COLORS.map((color) => (
                            <button
                                key={color.name}
                                onClick={() => setSelectedColor(color.value)}
                                className={cn(
                                    "h-8 w-8 rounded-full border-2 border-border transition-all focus:outline-none",
                                    selectedColor === color.value && `ring-2 ring-offset-2 ${color.ring}`
                                )}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </Card>
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Select a Template</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-320px)] pr-4 -mr-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {TEMPLATES.map((template) => (
                                    <div key={template.id} className="group cursor-pointer" onClick={() => setSelectedTemplate(template.id)}>
                                        <Card className={cn(
                                            "relative w-full overflow-hidden border-2 rounded-lg transition-all duration-300",
                                            selectedTemplate === template.id ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50'
                                        )}>
                                            <div className="aspect-[8.5/11] bg-white overflow-hidden">
                                                <div className="origin-top-left scale-[0.3] sm:scale-[0.35] md:scale-[0.3]">
                                                    <ResumePreview 
                                                        resumeData={DUMMY_RESUME_DATA} 
                                                        templateName={template.id} 
                                                        className="w-[8.5in] h-[11in] bg-white" 
                                                        style={{'--theme-color': selectedColor} as React.CSSProperties}
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                        <h4 className="text-center font-semibold mt-2 text-sm">{template.name}</h4>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
