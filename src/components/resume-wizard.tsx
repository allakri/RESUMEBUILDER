
"use client";

import { useState } from 'react';
import type { ResumeDataWithIds } from '@/ai/resume-schema';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { FileText, Search, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ResumeWizardProps {
    initialResumeData: ResumeDataWithIds;
    onComplete: (data: ResumeDataWithIds) => void;
    onBack: () => void;
}

type WizardStep = 'heading';

export function ResumeWizard({ initialResumeData, onComplete, onBack }: ResumeWizardProps) {
    const [step, setStep] = useState<WizardStep>('heading');
    const [resume, setResume] = useState<ResumeDataWithIds>(initialResumeData);

    const [firstName, setFirstName] = useState(resume.name.split(' ')[0] === 'Your' ? '' : resume.name.split(' ')[0] || '');
    const [surname, setSurname] = useState(resume.name.split(' ')[1] === 'Name' ? '' : resume.name.split(' ').slice(1).join(' ') || '');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [pincode, setPincode] = useState('');

    const handleNext = () => {
        const finalResume = {
            ...resume,
            name: `${firstName} ${surname}`.trim(),
            location: [city, country, pincode].filter(Boolean).join(', '),
        };
        // This is where you would transition to the next step, e.g., setStep('summary')
        // For now, we'll call onComplete as if this is the only step.
        onComplete(finalResume);
    }
    
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
                                    {resume.phone && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                                <div className="relative">
                                    <label className="text-xs font-semibold text-gray-500">EMAIL</label>
                                    <Input type="email" value={resume.email} onChange={(e) => setResume({...resume, email: e.target.value})} className="pr-8"/>
                                    {resume.email && <CheckCircle2 className="absolute right-2 top-7 h-5 w-5 text-green-500" />}
                                </div>
                            </div>
                        </div>

                        {/* Right side: Template Preview */}
                        <div className="flex flex-col items-center justify-start">
                            <Card className="overflow-hidden relative group w-[300px] shadow-lg">
                               <Image src="https://placehold.co/400x565.png" alt="Resume Template Preview" width={300} height={424} data-ai-hint="resume document" />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="icon" className="rounded-full h-12 w-12">
                                        <Search className="h-6 w-6" />
                                    </Button>
                                </div>
                            </Card>
                             <Button variant="link" className="mt-4 text-primary">Change template</Button>
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
        </div>
    );
}
