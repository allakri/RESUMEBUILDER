'use server';

/**
 * @fileOverview This file contains the Genkit flow for creating a structured resume from text.
 *
 * - createResume - A function that takes unstructured text and returns a structured resume object.
 * - CreateResumeInput - The input type for the createResume function.
 * - ResumeData - The return type for the createResume function.
 * - ResumeDataWithIds - The ResumeData type with client-side generated IDs.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ResumeSchema = z.object({
  name: z.string().describe('The full name of the person.'),
  email: z.string().describe('The email address.'),
  phone: z.string().describe('The phone number.'),
  summary: z.string().describe('A professional summary.'),
  experience: z
    .array(
      z.object({
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
        name: z
          .string()
          .describe(
            'The name of the website (e.g., LinkedIn, GitHub, Portfolio)'
          ),
        url: z.string().url().describe('The URL'),
      })
    )
    .optional()
    .describe('A list of relevant websites or professional profiles.'),
  projects: z
    .array(
      z.object({
        name: z.string().describe('The project name.'),
        description: z.string().describe('A short description of the project.'),
        technologies: z
          .array(z.string())
          .describe('A list of technologies used in the project.'),
        url: z.string().url().optional().describe('The URL for the project.'),
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

export type ResumeDataWithIds = {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experience: ExperienceWithId[];
  education: EducationWithId[];
  skills: string[];
  websites: WebsiteWithId[];
  projects: ProjectWithId[];
  achievements?: string[];
  hobbies?: string[];
};

const CreateResumeInputSchema = z.object({
  resumeText: z.string().describe('The unstructured text of the resume.'),
});
export type CreateResumeInput = z.infer<typeof CreateResumeInputSchema>;

export async function createResume(
  input: CreateResumeInput
): Promise<ResumeData> {
  return createResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createResumePrompt',
  input: {schema: CreateResumeInputSchema},
  output: {schema: ResumeSchema},
  prompt: `You are an expert resume formatter.
  Analyze the following resume text and structure it into a professional resume format.
  Extract the name, contact information, summary, work experience, education, skills, projects, websites/profiles, achievements, and hobbies.

  Resume Text:
  {{{resumeText}}}
  `,
});

const createResumeFlow = ai.defineFlow(
  {
    name: 'createResumeFlow',
    inputSchema: CreateResumeInputSchema,
    outputSchema: ResumeSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
