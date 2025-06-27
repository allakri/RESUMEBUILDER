'use server';

/**
 * @fileOverview This file contains the Genkit flow for enhancing a resume with AI.
 *
 * - enhanceResume - A function that takes resume data and returns an improved version.
 * - ResumeData - The input and output type for the enhanceResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Re-using the schema from create-resume flow.
const ResumeSchema = z.object({
  name: z.string().describe('The full name of the person.'),
  email: z.string().describe('The email address.'),
  phone: z.string().describe('The phone number.'),
  linkedin: z.string().optional().describe('The LinkedIn profile URL.'),
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
});

export type ResumeData = z.infer<typeof ResumeSchema>;

export async function enhanceResume(input: ResumeData): Promise<ResumeData> {
  return enhanceResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceResumePrompt',
  input: {schema: ResumeSchema},
  output: {schema: ResumeSchema},
  prompt: `You are an expert resume writer and career coach. 
  Your task is to enhance the provided resume data. 
  Rewrite the summary to be more professional and impactful. 
  For each experience entry, review the responsibilities and rewrite them to use strong action verbs and quantify achievements where possible. 
  Do not invent new facts or numbers. Only improve the phrasing of the existing content. 
  Return the full, updated resume data in the exact same JSON format.

  Resume Data:
  {{{jsonStringify this}}}
  `,
});

const enhanceResumeFlow = ai.defineFlow(
  {
    name: 'enhanceResumeFlow',
    inputSchema: ResumeSchema,
    outputSchema: ResumeSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
