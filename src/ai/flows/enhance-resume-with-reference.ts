'use server';

/**
 * @fileOverview This file contains the Genkit flow for enhancing a resume using a reference document.
 *
 * - enhanceResumeWithReference - A function that takes resume data, a query, and a reference document to return an improved version.
 * - EnhanceResumeWithReferenceInput - The input type for the function.
 * - ResumeData - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ResumeSchema, type ResumeData} from '@/ai/resume-schema';
import mammoth from 'mammoth';

const EnhanceResumeWithReferenceInputSchema = z.object({
  resume: ResumeSchema.describe('The current resume data.'),
  query: z.string().describe("The user's instruction for how to enhance the resume."),
  referenceDataUri: z.string().describe(
      "A reference document (e.g., job description) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhanceResumeWithReferenceInput = z.infer<typeof EnhanceResumeWithReferenceInputSchema>;

export async function enhanceResumeWithReference(
  input: EnhanceResumeWithReferenceInput
): Promise<ResumeData> {
  return enhanceResumeWithReferenceFlow(input);
}

// This input schema is for the prompt itself, which might handle text differently
const PromptInputSchema = z.object({
    resumeJson: z.string(),
    query: z.string(),
    referenceText: z.string().optional(), // For DOCX
    referenceMedia: z.string().optional(), // for PDF/Images
});


const prompt = ai.definePrompt({
  name: 'enhanceResumeWithReferencePrompt',
  input: {schema: PromptInputSchema},
  output: {schema: ResumeSchema},
  prompt: `You are an expert resume writer and career coach. A user has provided their current resume data (in JSON format), a request to modify it, and a reference document.
Your task is to update the resume JSON based on the user's request, using the provided reference document to guide your improvements. For example, if the reference document is a job description, you should tailor the resume's summary and experience sections to better match the keywords, skills, and requirements mentioned in that job description.

- Only modify the parts of the resume relevant to the user's query and the reference document.
- Do not invent new facts or numbers unless explicitly asked.
- CRITICAL: If an item in an array (like an experience or project) has an 'id' field, you MUST return that item with the exact same 'id' in your response. This is essential for data integrity.
- If you create a new item in a list (e.g., a new experience entry), do not add an 'id' field to it.

User's Request:
{{{query}}}

Current Resume Data:
{{{resumeJson}}}

Reference Document Content:
{{#if referenceText}}
{{{referenceText}}}
{{/if}}
{{#if referenceMedia}}
{{media url=referenceMedia}}
{{/if}}
  `,
});

const enhanceResumeWithReferenceFlow = ai.defineFlow(
  {
    name: 'enhanceResumeWithReferenceFlow',
    inputSchema: EnhanceResumeWithReferenceInputSchema,
    outputSchema: ResumeSchema,
  },
  async (input) => {
    const dataUri = input.referenceDataUri;
    const mimeType = dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';'));

    const docxMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    let promptInput: z.infer<typeof PromptInputSchema> = {
        resumeJson: JSON.stringify(input.resume),
        query: input.query,
    };

    if (docxMimeTypes.includes(mimeType)) {
      // The model does not support DOCX, so we extract the text manually.
      const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
      const buffer = Buffer.from(base64Data, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      promptInput.referenceText = result.value;
    } else {
      // For supported types like PDF and images, pass the data URI to the multimodal prompt.
      promptInput.referenceMedia = dataUri;
    }

    const {output} = await prompt(promptInput);
    return output!;
  }
);
