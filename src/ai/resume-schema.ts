/**
 * @fileOverview This file defines the Zod schema and TypeScript types for the resume data structure.
 */
import {z} from 'genkit';

export const ResumeSchema = z.object({
  firstName: z.string().describe('The first name of the person.'),
  lastName: z.string().describe('The last name of the person.'),
  profilePictureUrl: z.string().optional().describe('URL to a profile picture.'),
  profession: z.string().optional().describe('The professional title or role (e.g., "Software Engineer").'),
  email: z.string().describe('The email address.'),
  phone: z.string().describe('The phone number.'),
  location: z.string().optional().describe('The city and country of residence.'),
  pinCode: z.string().optional().describe('The postal or ZIP code.'),
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
  linkedIn: z.string().optional().describe('URL to a LinkedIn profile.'),
  drivingLicense: z.string().optional().describe('Driving license details.'),
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

export const AIFeedbackSchema = z.object({
    score: z.number().describe("A numerical score (0-100) representing the resume’s compatibility with the provided request and reference documents."),
    justification: z.string().describe("A detailed explanation of the score, highlighting strengths and weaknesses."),
    suggestedRoles: z.array(z.string()).optional().describe("A list of other job roles the user might be a good fit for."),
    skillsToLearn: z.array(z.string()).optional().describe("A list of skills the user could learn to become a stronger candidate."),
});
export type AIFeedbackData = z.infer<typeof AIFeedbackSchema>;


export const EnhanceResumeWithReferenceOutputSchema = z.object({
    resume: ResumeSchema,
    feedback: AIFeedbackSchema,
});
export type EnhanceResumeWithReferenceOutput = z.infer<typeof EnhanceResumeWithReferenceOutputSchema>;
