'use server';

/**
 * @fileOverview This file contains the Genkit flow for creating a structured resume from text.
 *
 * - createResume - A function that takes unstructured text and returns a structured resume object.
 * - CreateResumeInput - The input type for the createResume function.
 * - ResumeData - The return type for the createResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ResumeSchema, type ResumeData } from '@/ai/resume-schema';

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
  Extract the name, profession, contact information, summary, work experience, education, skills, projects, websites/profiles, achievements, and hobbies.
  If you find sections that do not fit into the standard categories (like 'Certifications', 'Publications', or 'Languages'), parse them into the 'customSections' array. Each item should have a 'title' and its corresponding 'content'.
  Do not create 'id' fields for any items.

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
