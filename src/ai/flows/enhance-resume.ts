'use server';

/**
 * @fileOverview This file contains the Genkit flow for enhancing a resume with AI.
 *
 * - enhanceResume - A function that takes resume data and returns an improved version.
 * - ResumeData - The input and output type for the enhanceResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ResumeSchema, type ResumeData} from '@/ai/resume-schema';

export async function enhanceResume(input: ResumeData): Promise<ResumeData> {
  return enhanceResumeFlow(input);
}

const PromptInputSchema = z.object({
    resumeJson: z.string()
});

const prompt = ai.definePrompt({
  name: 'enhanceResumePrompt',
  input: {schema: PromptInputSchema},
  output: {schema: ResumeSchema},
  prompt: `You are an expert resume writer and career coach. 
  The user's full name is {{resume.firstName}} {{resume.lastName}}.
  Your task is to enhance the provided resume data. 
  - Rewrite the summary to be more professional and impactful. 
  - For each experience entry, review the responsibilities and rewrite them to use strong action verbs and quantify achievements where possible.
  - For each project, review the description and make it more concise and achievement-oriented.
  - For each custom section, review its content and improve the phrasing for clarity and impact.
  - Do not invent new facts or numbers. Only improve the phrasing of the existing content. 
  - CRITICAL: If an item in an array (like an experience or project) has an 'id' field, you MUST return that item with the exact same 'id' in your response. This is essential for data integrity.
  - Return the full, updated resume data in the exact same JSON format.

  Resume Data:
  {{{resumeJson}}}
  `,
});

const enhanceResumeFlow = ai.defineFlow(
  {
    name: 'enhanceResumeFlow',
    inputSchema: ResumeSchema,
    outputSchema: ResumeSchema,
  },
  async input => {
    const {output} = await prompt({ resumeJson: JSON.stringify(input) });
    return output!;
  }
);
