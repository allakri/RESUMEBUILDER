# ResumeRevamp: AI-Powered Resume Builder

Welcome to ResumeRevamp, a modern, AI-driven application designed to help you create, optimize, and tailor professional resumes with ease. Get past the applicant tracking systems (ATS) and land your dream job.

## Core Features

- **AI-Powered Content Generation**: Let AI help you write and enhance your resume content.
- **Multiple Creation Methods**: Start from scratch, upload an existing resume (PDF, DOCX, image), or simply take a photo of a physical copy.
- **Guided Wizard**: A step-by-step process ensures you don't miss any crucial sections.
- **Real-time Editor & Preview**: See your changes instantly with a live preview.
- **Customizable Templates**: Choose from a variety of professional templates and color schemes.
- **AI Assistant**: Get targeted feedback and improvements. Tailor your resume for specific job descriptions by providing reference documents.
- **ATS Compatibility Score**: See how well your resume matches a job description and get actionable suggestions for improvement.
- **Multiple Download Formats**: Export your final resume as a visually perfect PDF or an ATS-friendly DOCX file.

## Getting Started: Creating Your Resume

ResumeRevamp offers three convenient ways to begin building your resume.

### 1. Create a New Resume (From Scratch)

This mode is perfect if you want to build your resume from the ground up with guidance.

1.  **Click "Start From Scratch"** on the home page.
2.  You will be guided through a **multi-step wizard**:
    *   **Heading**: Fill in your name, profession, and contact details.
    *   **Experience**: Add your work history, including job titles, companies, and responsibilities.
    *   **Education**: Detail your academic background.
    *   **Skills**: List your key skills. The system will help you format them.
    *   **Summary**: Write a compelling professional summary.
    *   **Custom**: Add any extra sections you need, like "Certifications" or "Languages".
    *   **Finalize**: Get a first look at your resume by selecting an initial template and theme color.
3.  Once the wizard is complete, you'll be taken to the main **Resume Editor** where you can make further refinements.

### 2. Upload an Existing Resume

Have a resume already? Let our AI do the heavy lifting.

1.  **Click "Upload & Optimize"** on the home page.
2.  **Drag and drop** or select your resume file. We support PDF, DOCX, and image formats (JPG, PNG).
3.  Our AI will read your document, extract the text, and intelligently parse it into the structured fields of a resume (like experience, education, etc.).
4.  You will then be taken to the **wizard**, with all the extracted information pre-filled. You can review, edit, and add any missing information before proceeding to the editor.

### 3. Use Your Camera

If you only have a paper copy of your resume, you can use your device's camera.

1.  **Click "Take Photo"** on the home page.
2.  Grant the necessary camera permissions to your browser.
3.  **Take a clear photo** of your resume. Ensure good lighting and a flat surface for the best results.
4.  The AI will perform Optical Character Recognition (OCR) to read the text and structure it, just like in the upload mode.
5.  You will land in the **wizard** to review the extracted data before moving to the main editor.

## The Resume Editor: Enhancing with AI

The editor is where you refine your resume. The left sidebar contains the powerful AI Assistant.

### How to Use the AI Assistant

1.  **Open the "AI Assistant" Tab**: In the sidebar, you'll find a text area to give instructions to the AI.
2.  **Make General Improvements**: Type a simple command, like:
    *   *"Rewrite my summary to be more impactful."*
    *   *"Make my experience bullet points use stronger action verbs."*
3.  **Enhance with a Reference (Job Description)**: This is the most powerful feature for job seekers.
    *   Type a command like, *"Tailor my resume for the Senior Product Manager role at Acme Inc."*
    *   Click **"Attach References"** and upload the job description file (PDF or DOCX).
    *   Click **"Enhance with AI"**.

### Understanding the AI Analysis & ATS Score

When you enhance your resume using a reference document, the AI provides a detailed analysis in the **"AI Analysis"** tab:

-   **ATS Compatibility Score**: A score from 0-100 indicating how well your resume aligns with the job description you provided.
-   **Justification**: A detailed explanation of your score, highlighting strengths and weaknesses.
-   **Suggested Skills to Learn**: A list of skills mentioned in the job description that are missing from your resume.
-   **Other Suggested Roles**: Based on your profile, the AI suggests other job titles you might be a good fit for.

This feedback loop allows you to iteratively improve your resume until it is perfectly optimized for the job you want.

## Technology Stack

-   **Frontend**: Next.js (App Router), React, TypeScript
-   **UI**: Tailwind CSS, ShadCN UI
-   **AI**: Google Genkit, integrated with Gemini AI models.
-   **File Processing**:
    -   `mammoth`: for parsing `.docx` files.
    -   `jspdf` & `html2canvas`: for generating PDF documents.
    -   `docx`: for generating ATS-friendly `.docx` documents.