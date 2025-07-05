import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { ResumeDataWithIds } from '@/ai/resume-schema';

export const generateDocxBlob = async (resume: ResumeDataWithIds): Promise<Blob> => {
  const doc = new Document({
    creator: 'ResumeRevamp',
    title: 'Resume',
    description: `Resume for ${resume.firstName} ${resume.lastName}`,
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `${resume.firstName} ${resume.lastName}`,
              bold: true,
              size: 32, // 16pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: resume.profession || '',
              size: 24, // 12pt
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: [resume.email, resume.phone, resume.location].filter(Boolean).join(' | '),
              size: 20, // 10pt
            }),
          ],
        }),

        // Summary
        new Paragraph({
          children: [
            new TextRun({ text: 'Summary', bold: true, size: 24 }),
          ],
          heading: HeadingLevel.HEADING_1,
          border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: resume.summary,
          spacing: { after: 200 },
        }),

        // Experience
        new Paragraph({
          children: [
            new TextRun({ text: 'Experience', bold: true, size: 24 }),
          ],
          heading: HeadingLevel.HEADING_1,
          border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { after: 100 },
        }),
        ...(resume.experience || []).flatMap(exp => [
          new Paragraph({
            children: [
              new TextRun({ text: exp.title, bold: true, size: 22 }),
              new TextRun({ text: `\t${exp.dates}`, size: 22 }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: exp.company, italics: true, size: 20 }),
              new TextRun({ text: `\t${exp.location}`, italics: true, size: 20 }),
            ],
            spacing: { after: 50 },
          }),
          ...exp.responsibilities.map(resp => new Paragraph({ text: resp, bullet: { level: 0 } })),
          new Paragraph({ text: '', spacing: { after: 200 } }),
        ]),

        // Education
        new Paragraph({
          children: [
            new TextRun({ text: 'Education', bold: true, size: 24 }),
          ],
          heading: HeadingLevel.HEADING_1,
          border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { after: 100 },
        }),
        ...(resume.education || []).flatMap(edu => [
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree, bold: true, size: 22 }),
              new TextRun({ text: `\t${edu.dates}`, size: 22 }),
            ],
            spacing: { after: 50 },
          }),
           new Paragraph({
            children: [
              new TextRun({ text: edu.school, italics: true, size: 20 }),
              new TextRun({ text: `\t${edu.location}`, italics: true, size: 20 }),
            ],
            spacing: { after: 200 },
          }),
        ]),
        
        // Skills
        new Paragraph({
          children: [
            new TextRun({ text: 'Skills', bold: true, size: 24 }),
          ],
          heading: HeadingLevel.HEADING_1,
          border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
          spacing: { after: 100 },
        }),
        new Paragraph({ text: (resume.skills || []).join(', '), spacing: { after: 200 } }),
        
        // Projects
        ...((resume.projects && resume.projects.length > 0) ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Projects', bold: true, size: 24 }),
            ],
            heading: HeadingLevel.HEADING_1,
            border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { after: 100 },
          }),
          ...(resume.projects || []).flatMap(proj => [
            new Paragraph({
              children: [
                new TextRun({ text: proj.name, bold: true, size: 22 }),
                ...(proj.url ? [new TextRun({ text: `\t${proj.url}`, italics: true, size: 22 })] : []),
              ],
              spacing: { after: 50 },
            }),
            new Paragraph({ text: proj.description }),
            new Paragraph({ text: `Technologies: ${proj.technologies.join(', ')}`, italics: true, spacing: { after: 200 } }),
          ]),
        ] : []),

        // Custom Sections
        ...(resume.customSections || []).flatMap(sec => [
          new Paragraph({
            children: [
              new TextRun({ text: sec.title, bold: true, size: 24 }),
            ],
            heading: HeadingLevel.HEADING_1,
            border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { after: 100 },
          }),
          new Paragraph({ text: sec.content, spacing: { after: 200 } }),
        ]),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
};
