'use server';

/**
 * @fileOverview This file contains the Genkit flow for enhancing a resume using a reference document.
 *
 * - enhanceResumeWithReference - A function that takes resume data, a query, and a reference document to return an improved version.
 * - EnhanceResumeWithReferenceInput - The input type for the function.
 * - EnhanceResumeWithReferenceOutput - The return type for the function.
 * - AIFeedbackData - The type for the AI feedback object.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ResumeSchema, type ResumeData} from '@/ai/resume-schema';
import mammoth from 'mammoth';

const EnhanceResumeWithReferenceInputSchema = z.object({
  resume: ResumeSchema.describe('The current resume data.'),
  query: z.string().describe("The user's instruction for how to enhance the resume."),
  referenceDataUris: z.array(z.string()).describe(
      "A list of reference documents (e.g., job descriptions) as data URIs that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceResumeWithReferenceInput = z.infer<typeof EnhanceResumeWithReferenceInputSchema>;

const AIFeedbackSchema = z.object({
    score: z.number().describe("A numerical score (0-100) representing the resume’s compatibility with the provided request and reference documents."),
    justification: z.string().describe("A detailed explanation of the score, highlighting strengths and weaknesses."),
    suggestedRoles: z.array(z.string()).optional().describe("A list of other job roles the user might be a good fit for."),
    skillsToLearn: z.array(z.string()).optional().describe("A list of skills the user could learn to become a stronger candidate."),
});
export type AIFeedbackData = z.infer<typeof AIFeedbackSchema>;


const EnhanceResumeWithReferenceOutputSchema = z.object({
    resume: ResumeSchema,
    feedback: AIFeedbackSchema,
});
export type EnhanceResumeWithReferenceOutput = z.infer<typeof EnhanceResumeWithReferenceOutputSchema>;


export async function enhanceResumeWithReference(
  input: EnhanceResumeWithReferenceInput
): Promise<EnhanceResumeWithReferenceOutput> {
  return enhanceResumeWithReferenceFlow(input);
}

// This input schema is for the prompt itself, which might handle text differently
const PromptInputSchema = z.object({
    resumeJson: z.string(),
    query: z.string(),
    referenceDocuments: z.array(z.object({
        text: z.string().optional(),
        media: z.string().optional(),
    }))
});


const prompt = ai.definePrompt({
  name: 'enhanceResumeWithReferencePrompt',
  input: {schema: PromptInputSchema},
  output: {schema: EnhanceResumeWithReferenceOutputSchema},
  prompt: `You are an expert resume writer and career coach.
  
Your tasks are to:
1. Update the resume JSON based on the user's request, using the provided reference documents to guide your improvements. For example, if the reference documents include a job description, you should tailor the resume's summary and experience sections to better match the keywords, skills, and requirements mentioned.
- Only modify the parts of the resume relevant to the user's query and the reference documents.
- Do not invent new facts or numbers unless explicitly asked.
- CRITICAL: If an item in an array (like an experience or project) has an 'id' field, you MUST return that item with the exact same 'id' in your response. This is essential for data integrity.
- If you create a new item in a list (e.g., a new experience entry), do not add an 'id' field to it.

2. Provide detailed feedback based on your analysis. This includes:
- A compatibility score (0-100).
- A justification for the score.
- A list of other job roles the user might be suited for.
- A list of skills the user could learn to improve their profile for the target role.

User's Request:
{{{query}}}

Current Resume Data:
{{{resumeJson}}}

Reference Documents:
{{#each referenceDocuments}}
--- Document Start ---
{{#if this.text}}
{{{this.text}}}
{{/if}}
{{#if this.media}}
{{media url=this.media}}
{{/if}}
--- Document End ---
{{/each}}
  `,
});

const enhanceResumeWithReferenceFlow = ai.defineFlow(
  {
    name: 'enhanceResumeWithReferenceFlow',
    inputSchema: EnhanceResumeWithReferenceInputSchema,
    outputSchema: EnhanceResumeWithReferenceOutputSchema,
  },
  async (input) => {
    
    const docxMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    const referenceDocuments: z.infer<typeof PromptInputSchema>['referenceDocuments'] = [];

    for (const dataUri of input.referenceDataUris) {
      const mimeType = dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';'));

      if (docxMimeTypes.includes(mimeType)) {
        // The model does not support DOCX, so we extract the text manually.
        const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
        const buffer = Buffer.from(base64Data, 'base64');
        const result = await mammoth.extractRawText({ buffer });
        referenceDocuments.push({ text: result.value });
      } else {
        // For supported types like PDF and images, pass the data URI to the multimodal prompt.
        referenceDocuments.push({ media: dataUri });
      }
    }
    
    const promptInput: z.infer<typeof PromptInputSchema> = {
        resumeJson: JSON.stringify(input.resume),
        query: input.query,
        referenceDocuments: referenceDocuments,
    };

    const {output} = await prompt(promptInput);
    return output!;
  }
);
