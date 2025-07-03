'use server';

/**
 * @fileOverview This file contains the Genkit flow for enhancing a resume via a chat command.
 *
 * - chatEnhanceResume - A function that takes resume data and a user query to returns an improved version and AI feedback.
 * - ChatEnhanceResumeInput - The input type for the chatEnhanceResume function.
 * - EnhanceResumeWithReferenceOutput - The return type for the chatEnhanceResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  ResumeSchema,
  EnhanceResumeWithReferenceOutputSchema,
  type EnhanceResumeWithReferenceOutput,
} from '@/ai/resume-schema';


const ChatEnhanceResumeInputSchema = z.object({
  resume: ResumeSchema.describe('The current resume data.'),
  query: z.string().describe("The user's instruction for how to enhance the resume."),
});
export type ChatEnhanceResumeInput = z.infer<typeof ChatEnhanceResumeInputSchema>;


export async function chatEnhanceResume(
  input: ChatEnhanceResumeInput
): Promise<EnhanceResumeWithReferenceOutput> {
  return chatEnhanceResumeFlow(input);
}

const PromptInputSchema = z.object({
    resumeJson: z.string(),
    query: z.string(),
});

const prompt = ai.definePrompt({
  name: 'chatEnhanceResumePrompt',
  input: {schema: PromptInputSchema},
  output: {schema: EnhanceResumeWithReferenceOutputSchema},
  prompt: `You are an expert resume writer and career coach. A user has provided their current resume data (in JSON format) and a request to modify it.
The user's full name is {{resume.firstName}} {{resume.lastName}}.

Your tasks are to:
1. Update the resume JSON based on the user's request. For example, if the user asks to tailor the resume for a specific job role, you should improve the summary and experience to match.
- Only modify the parts of the resume relevant to the user's query.
- Do not invent new facts or numbers unless explicitly asked.
- CRITICAL: If an item in an array (like an experience or project) has an 'id' field, you MUST return that item with the exact same 'id' in your response. This is essential for data integrity.
- If you create a new item in a list (e.g., a new experience entry), do not add an 'id' field to it.

2. Provide detailed feedback based on the user's request. This includes:
- A compatibility score (0-100) for how well the resume aligns with the user's request (e.g., for a specific job role).
- A justification for the score.
- A list of other job roles the user might be suited for.
- A list of skills the user could learn to improve their profile for the target role.

User's Request:
{{{query}}}

Current Resume Data:
{{{resumeJson}}}
  `,
});

const chatEnhanceResumeFlow = ai.defineFlow(
  {
    name: 'chatEnhanceResumeFlow',
    inputSchema: ChatEnhanceResumeInputSchema,
    outputSchema: EnhanceResumeWithReferenceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt({
        query: input.query,
        resumeJson: JSON.stringify(input.resume)
    });
    return output!;
  }
);
