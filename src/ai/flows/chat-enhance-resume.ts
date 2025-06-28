'use server';

/**
 * @fileOverview This file contains the Genkit flow for enhancing a resume via a chat command.
 *
 * - chatEnhanceResume - A function that takes resume data and a user query to returns an improved version.
 * - ChatEnhanceResumeInput - The input type for the chatEnhanceResume function.
 * - ResumeData - The return type for the chatEnhanceResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ResumeSchema, type ResumeData} from '@/ai/resume-schema';

const ChatEnhanceResumeInputSchema = z.object({
  resume: ResumeSchema.describe('The current resume data.'),
  query: z.string().describe("The user's instruction for how to enhance the resume."),
});
export type ChatEnhanceResumeInput = z.infer<typeof ChatEnhanceResumeInputSchema>;


export async function chatEnhanceResume(
  input: ChatEnhanceResumeInput
): Promise<ResumeData> {
  return chatEnhanceResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatEnhanceResumePrompt',
  input: {schema: ChatEnhanceResumeInputSchema},
  output: {schema: ResumeSchema},
  prompt: `You are an expert resume writer and career coach. A user has provided their current resume data (in JSON format) and a request to modify it.
Your task is to update the resume JSON based on the user's request and return the full, updated resume data in the exact same JSON format.

- Only modify the parts of the resume relevant to the user's query.
- Do not invent new facts or numbers unless explicitly asked.
- CRITICAL: If an item in an array (like an experience or project) has an 'id' field, you MUST return that item with the exact same 'id' in your response. This is essential for data integrity.
- If you create a new item in a list (e.g., a new experience entry), do not add an 'id' field to it.

User's Request:
{{{query}}}

Current Resume Data:
{{{jsonStringify resume}}}
  `,
});

const chatEnhanceResumeFlow = ai.defineFlow(
  {
    name: 'chatEnhanceResumeFlow',
    inputSchema: ChatEnhanceResumeInputSchema,
    outputSchema: ResumeSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
