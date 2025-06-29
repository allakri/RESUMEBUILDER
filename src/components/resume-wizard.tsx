
"use client";

import { useState } from 'react';
import type { ResumeDataWithIds } from '@/ai/resume-schema';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { FileText, Search, CheckCircle2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { cn } from '@/lib/utils';
import { ResumePreview } from './resume-preview';

interface ResumeWizardProps {
    initialResumeData: ResumeDataWithIds;
    onComplete: (data: ResumeDataWithIds) => void;
    onBack: () => void;
}

type WizardStep = 'heading';

const TEMPLATES = [
    { id: 'professional', name: 'Professional', imageUrl: 'https://placehold.co/200x283.png', hint: 'resume document' },
    { id: 'modern', name: 'Modern', imageUrl: 'https://placehold.co/200x283.png', hint: 'resume layout' },
    { id: 'classic', name: 'Classic', imageUrl: 'https://placehold.co/200x283.png', hint: 'resume text' },
    { id: 'executive', name: 'Executive', imageUrl: 'https://placehold.co/200x283.png', hint: 'resume corporate' },
    { id: 'minimalist', name: 'Minimalist', imageUrl: 'https://placehold.co/200x283.png', hint: 'resume simple' },
    { id: 'creative', name: 'Creative', imageUrl: 'https://placehold.co/200x283.png', hint: 'resume design' },
];

const THEME_COLORS = ['#333333', '#008080', '#1E40AF', '#86198F', '#F97316', '#DC2626'];


export function ResumeWizard({ initialResumeData, onComplete, onBack }: ResumeWizardProps) {
    const [step, setStep] = useState<WizardStep>('heading');
    const [resume, setResume] = useState<ResumeDataWithIds>(initialResumeData);

    const [firstName, setFirstName] = useState(resume.name.split(' ')[0] === 'Your' ? '' : resume.name.split(' ')[0] || '');
    const [surname, setSurname] = useState(resume.name.split(' ')[1] === 'Name' ? '' : resume.name.split(' ').slice(1).join(' ') || '');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [pincode, setPincode] = useState('');

    const [selectedTemplate, setSelectedTemplate] = useState('professional');
    const [themeColor, setThemeColor] = useState('#333333');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);


    const handleNext = () => {
        const finalResume = {
            ...resume,
            name: `${firstName} ${surname}`.trim(),
            location: [city, country, pincode].filter(Boolean).join(', '),
        };
        onComplete(finalResume);
    }
    
    const previewResumeData: ResumeDataWithIds = {
        ...resume,
        name: `${firstName} ${surname}`.trim() || "Your Name",
        location: [city, country, pincode].filter(Boolean).join(', ') || "City, Country",
        email: resume.email === 'your.email@example.com' ? "your.email@example.com" : resume.email,
        phone: resume.phone === '123-456-7890' ? "123-456-7890" : resume.phone,
    };

    const renderHeadingStep = () => {
        return (
            <div className='flex flex-col h-full'>
                <h1 className="text-3xl font-bold">Resume Heading</h1>
                <div className="flex-grow mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
                        {/* Left side: Form */}
                        <div className="space-y-6 max-w-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-500">FIRST NAME</label>
                                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pr-8" />
                                    {firstName && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-500">SURNAME</label>
                                    <Input value={surname} onChange={(e) => setSurname(e.target.value)} className="pr-8" />
                                    {surname && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="relative col-span-1">
                                    <label className="text-xs font-semibold text-gray-500">CITY</label>
                                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="pr-8" />
                                    {city && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                                 <div className="relative col-span-1">
                                    <label className="text-xs font-semibold text-gray-500">COUNTRY</label>
                                    <Input value={country} onChange={(e) => setCountry(e.target.value)} className="pr-8" />
                                    {country && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                                 <div className="relative col-span-1">
                                    <label className="text-xs font-semibold text-gray-500">PIN CODE</label>
                                    <Input value={pincode} onChange={(e) => setPincode(e.target.value)} className="pr-8"/>
                                    {pincode && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-500">PHONE</label>
                                    <Input value={resume.phone} onChange={(e) => setResume({...resume, phone: e.target.value})} className="pr-8" />
                                    {resume.phone !== '123-456-7890' && resume.phone && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-500">EMAIL</label>
                                    <Input type="email" value={resume.email} onChange={(e) => setResume({...resume, email: e.target.value})} className="pr-8"/>
                                    {resume.email !== 'your.email@example.com' && resume.email && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                            </div>
                        </div>

                        {/* Right side: Template Preview */}
                        <div className="flex flex-col items-center justify-start mt-8 lg:mt-0">
                            <Card className="overflow-hidden relative group w-full max-w-[350px] shadow-lg cursor-pointer" onClick={() => setIsTemplateModalOpen(true)}>
                                <div className="aspect-[8.5/11] w-full scale-100 transform-origin-top bg-white">
                                    <ResumePreview
                                        resumeData={previewResumeData}
                                        templateName={selectedTemplate}
                                        className="w-full h-full"
                                        style={{ "--theme-color": themeColor } as React.CSSProperties}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <Search className="h-10 w-10 text-white" />
                                </div>
                            </Card>
                            <Button variant="link" className="mt-2 text-primary" onClick={() => setIsTemplateModalOpen(true)}>Change template</Button>
                        </div>
                    </div>
                </div>

                <div className="mt-auto flex justify-between items-end pb-4">
                    <div>
                         <Button variant="outline" onClick={onBack} className="rounded-full px-8 py-5 border-black text-black hover:bg-gray-100">Back</Button>
                         <div className="text-xs text-gray-500 mt-4 space-x-2">
                            <Link href="#" className="hover:underline">Terms</Link>
                            <span>|</span>
                            <Link href="#" className="hover:underline">Privacy Policy</Link>
                            <span>|</span>
                            <Link href="#" className="hover:underline">Contact Us</Link>
                            <span className='block mt-1'>&copy; 2025, NOW Limited. All rights reserved.</span>
                         </div>
                    </div>
                    <Button onClick={handleNext} size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 px-10 py-6">Continue</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-white text-black">
            <aside className="w-20 bg-[#2C3E50] p-4 flex flex-col items-center sticky top-0 h-screen">
                <div className="p-2 rounded-md">
                    <FileText className="h-8 w-8 text-white" />
                </div>
            </aside>
            <main className="flex-1 p-10 overflow-y-auto">
                {step === 'heading' && renderHeadingStep()}
            </main>
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Change Template</DialogTitle>
                         <button onClick={() => setIsTemplateModalOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </button>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-6 p-1 pr-4">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Theme Color</h3>
                            <div className="flex flex-wrap gap-3">
                                {THEME_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setThemeColor(color)}
                                        className={cn("h-8 w-8 rounded-full border-2 transition-all", themeColor === color ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300')}
                                        style={{ backgroundColor: color }}
                                    >
                                      <span className="sr-only">Set theme color to {color}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Templates</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {TEMPLATES.map(template => (
                                    <div
                                        key={template.id}
                                        className={cn(
                                            "border-2 rounded-lg overflow-hidden cursor-pointer transition-all",
                                            selectedTemplate === template.id ? "border-primary ring-2 ring-primary/50" : "border-gray-200 hover:border-primary/50"
                                        )}
                                        onClick={() => setSelectedTemplate(template.id)}
                                    >
                                        <Image src={template.imageUrl} alt={template.name} width={200} height={283} className="w-full object-cover" data-ai-hint={template.hint} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button size="lg" onClick={() => setIsTemplateModalOpen(false)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    