'use client';

import {
  CheckCircle2,
  Circle,
  CircleDot,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
} from 'lucide-react';
import { ProgressCircle } from './progress-circle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from './ui/sidebar';

const steps = [
  { name: 'Personal Info', icon: User, status: 'complete' },
  { name: 'Work Experience', icon: Briefcase, status: 'complete' },
  { name: 'Education', icon: GraduationCap, status: 'current' },
  { name: 'Skills', icon: Sparkles, status: 'upcoming' },
  { name: 'Summary', icon: Award, status: 'upcoming' },
];

export function BuilderSidebar() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-6 w-6 text-green-500 bg-white rounded-full" />;
      case 'current':
        return <CircleDot className="h-6 w-6 text-primary" />;
      default:
        return <Circle className="h-6 w-6 text-muted" />;
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="items-center justify-center p-4">
        <FileText className="h-8 w-8 text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent className="flex justify-center p-4">
        <div className="relative">
          <div
            className="absolute left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 bg-gray-600"
            aria-hidden="true"
          ></div>
          <ol className="relative flex flex-col items-center gap-y-8">
            {steps.map((step, index) => (
              <li key={index} className="flex items-center">
                <span className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-background">
                  {getStatusIcon(step.status)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <ProgressCircle progress={83} />
      </SidebarFooter>
    </Sidebar>
  );
}
