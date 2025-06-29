'use server';

/**
 * @fileOverview This file contains the Genkit flow for optimizing a resume for ATS systems.
 *
 * - optimizeResumeForAts - A function that takes a resume PDF data URI and optimizes it for ATS.
 * - OptimizeResumeForAtsInput - The input type for the optimizeResumeForAts function.
 * - OptimizeResumeForAtsOutput - The return type for the optimizeResumeForAts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import mammoth from 'mammoth';

const OptimizeResumeForAtsInputSchema = z.object({
  resumePdfDataUri: z
    .string()
    .describe(
      "The resume in a supported format (PDF, image, DOCX) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OptimizeResumeForAtsInput = z.infer<typeof OptimizeResumeForAtsInputSchema>;

const OptimizeResumeForAtsOutputSchema = z.object({
  optimizedResumeText: z
    .string()
    .describe('The optimized or extracted resume content in plain text format.'),
});
export type OptimizeResumeForAtsOutput = z.infer<typeof OptimizeResumeForAtsOutputSchema>;

export async function optimizeResumeForAts(
  input: OptimizeResumeForAtsInput
): Promise<OptimizeResumeForAtsOutput> {
  return optimizeResumeForAtsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeResumeForAtsPrompt',
  input: {schema: OptimizeResumeForAtsInputSchema},
  output: {schema: OptimizeResumeForAtsOutputSchema},
  prompt: `You are an expert resume optimizer specializing in making resumes ATS-friendly.

  Analyze the resume provided and generate an optimized version that is tailored for Applicant Tracking Systems (ATS).
  Focus on improving the resume's structure, keywords, and overall readability for ATS software.
  Identify and incorporate relevant keywords based on common industry practices and job descriptions.

  Here is the resume content:

  {{media url=resumePdfDataUri}}
  `,
});

const optimizeResumeForAtsFlow = ai.defineFlow(
  {
    name: 'optimizeResumeForAtsFlow',
    inputSchema: OptimizeResumeForAtsInputSchema,
    outputSchema: OptimizeResumeForAtsOutputSchema,
  },
  async (input) => {
    const dataUri = input.resumePdfDataUri;
    const mimeType = dataUri.substring(dataUri.indexOf(':') + 1, dataUri.indexOf(';'));

    const docxMimeTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (docxMimeTypes.includes(mimeType)) {
      // The model does not support DOCX, so we extract the text manually.
      const base64Data = dataUri.substring(dataUri.indexOf(',') + 1);
      const buffer = Buffer.from(base64Data, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      return { optimizedResumeText: result.value };
    }

    // For supported types like PDF and images, use the multimodal prompt.
    const {output} = await prompt(input);
    return output!;
  }
);
