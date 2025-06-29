/**
 * @fileOverview This file defines the Zod schema and TypeScript types for the resume data structure.
 */
import {z} from 'genkit';

export const ResumeSchema = z.object({
  name: z.string().describe('The full name of the person.'),
  email: z.string().describe('The email address.'),
  phone: z.string().describe('The phone number.'),
  summary: z.string().describe('A professional summary.'),
  experience: z
    .array(
      z.object({
        id: z.string().optional().describe("Unique identifier. Preserve if present."),
        title: z.string().describe('The job title.'),
        company: z.string().describe('The company name.'),
        location: z.string().describe('The job location.'),
        dates: z.string().describe('The dates of employment.'),
        responsibilities: z
          .array(z.string())
          .describe('A list of responsibilities or achievements.'),
      })
    )
    .describe('The work experience section.'),
  education: z
    .array(
      z.object({
        id: z.string().optional().describe("Unique identifier. Preserve if present."),
        degree: z.string().describe('The degree or certification obtained.'),
        school: z.string().describe('The name of the school or institution.'),
        location: z.string().describe('The location of the school.'),
        dates: z.string().describe('The dates of attendance.'),
      })
    )
    .describe('The education section.'),
  skills: z.array(z.string()).describe('A list of relevant skills.'),
  websites: z
    .array(
      z.object({
        id: z.string().optional().describe("Unique identifier. Preserve if present."),
        name: z
          .string()
          .describe(
            'The name of the website (e.g., LinkedIn, GitHub, Portfolio)'
          ),
        url: z.string().describe('The URL'),
      })
    )
    .optional()
    .describe('A list of relevant websites or professional profiles.'),
  projects: z
    .array(
      z.object({
        id: z.string().optional().describe("Unique identifier. Preserve if present."),
        name: z.string().describe('The project name.'),
        description: z.string().describe('A short description of the project.'),
        technologies: z
          .array(z.string())
          .describe('A list of technologies used in the project.'),
        url: z.string().optional().describe('The URL for the project.'),
      })
    )
    .optional()
    .describe('A list of personal or professional projects.'),
  achievements: z
    .array(z.string())
    .optional()
    .describe('A list of achievements, awards, or honors.'),
  hobbies: z
    .array(z.string())
    .optional()
    .describe('A list of hobbies and interests.'),
  customSections: z
    .array(
      z.object({
        id: z.string().optional().describe("Unique identifier. Preserve if present."),
        title: z.string().describe('The title of the custom section.'),
        content: z
          .string()
          .describe(
            'The content of the custom section, can be a paragraph or a list of items.'
          ),
      })
    )
    .optional()
    .describe(
      "A list of custom user-defined sections, like 'Certifications' or 'Languages'."
    ),
});

export type ResumeData = z.infer<typeof ResumeSchema>;

export type WebsiteWithId = {id: string; name: string; url: string};
export type ProjectWithId = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
};
export type ExperienceWithId = ResumeData['experience'][0] & {id: string};
export type EducationWithId = ResumeData['education'][0] & {id: string};
export type CustomSectionWithId = {id: string; title: string; content: string};

export type ResumeDataWithIds = Omit<ResumeData, 'experience' | 'education' | 'websites' | 'projects' | 'customSections'> & {
  experience: ExperienceWithId[];
  education: EducationWithId[];
  skills: string[];
  websites: WebsiteWithId[];
  projects: ProjectWithId[];
  achievements: string[];
  hobbies: string[];
  customSections: CustomSectionWithId[];
};
