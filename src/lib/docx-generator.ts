import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  TabStopType,
  TabStopPosition,
} from 'docx';
import type { ResumeDataWithIds } from '@/ai/resume-schema';

// Using a standard, professional font available on most systems.
const FONT_FAMILY = "Calibri";

export const generateDocxBlob = async (resume: ResumeDataWithIds): Promise<Blob> => {
  const doc = new Document({
    creator: 'ResumeRevamp',
    title: `Resume for ${resume.firstName} ${resume.lastName}`,
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: "22pt", // 11pt
          },
        },
      },
      paragraphStyles: [
        {
          id: "Header",
          name: "Header",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: "36pt", // 18pt
            bold: true,
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 }, // 6pt
          },
        },
        {
          id: "Subheader",
          name: "Subheader",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: "24pt", // 12pt
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          },
        },
         {
          id: "Contact",
          name: "Contact",
          basedOn: "Normal",
          next: "Normal",
          run: {
            size: "20pt", // 10pt
          },
          paragraph: {
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }, // 12pt
          },
        },
        {
          id: "SectionHeading",
          name: "Section Heading",
          basedOn: "Normal",
          next: "Normal",
          run: {
            bold: true,
            size: "24pt", // 12pt
            allCaps: true,
          },
          paragraph: {
             border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
             spacing: { before: 240, after: 120 },
          },
        },
         {
          id: "JobTitle",
          name: "Job Title",
          basedOn: "Normal",
          next: "Normal",
          run: {
            bold: true,
            size: "22pt", // 11pt
          },
        },
         {
          id: "Company",
          name: "Company",
          basedOn: "Normal",
          next: "Normal",
          run: {
            italics: true,
            size: "22pt",
          },
           paragraph: {
            spacing: { after: 60 },
          },
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.75),
            right: convertInchesToTwip(0.75),
            bottom: convertInchesToTwip(0.75),
            left: convertInchesToTwip(0.75),
          },
        },
      },
      children: [
        new Paragraph({ style: "Header", text: `${resume.firstName} ${resume.lastName}` }),
        ...(resume.profession ? [new Paragraph({ style: "Subheader", text: resume.profession })] : []),
        new Paragraph({
          style: "Contact",
          text: [resume.email, resume.phone, resume.location].filter(Boolean).join(' | '),
        }),

        // Summary
        new Paragraph({ style: "SectionHeading", text: 'Summary' }),
        new Paragraph({ text: resume.summary }),

        // Experience
        new Paragraph({ style: "SectionHeading", text: 'Experience' }),
        ...(resume.experience || []).flatMap(exp => [
          new Paragraph({
            style: "JobTitle",
            children: [
              new TextRun(exp.title),
              new TextRun({ text: `\t${exp.dates}`, style: "Default" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
          }),
          new Paragraph({
            style: "Company",
             children: [
              new TextRun(exp.company),
              new TextRun({ text: `\t${exp.location}`, style: "Default" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
          }),
          ...exp.responsibilities.map(resp => new Paragraph({ text: resp, bullet: { level: 0 } })),
          new Paragraph({ text: '' }), // Spacer
        ]),

        // Education
        new Paragraph({ style: "SectionHeading", text: 'Education' }),
        ...(resume.education || []).flatMap(edu => [
           new Paragraph({
            style: "JobTitle",
            children: [
              new TextRun(edu.degree),
              new TextRun({ text: `\t${edu.dates}`, style: "Default" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
          }),
           new Paragraph({
            style: "Company",
            children: [
              new TextRun(edu.school),
              new TextRun({ text: `\t${edu.location}`, style: "Default" }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
          }),
          new Paragraph({ text: '' }), // Spacer
        ]),
        
        // Skills
        new Paragraph({ style: "SectionHeading", text: 'Skills' }),
        new Paragraph({ text: (resume.skills || []).join(', ') }),
        
        // Projects
        ...((resume.projects && resume.projects.length > 0) ? [
          new Paragraph({ style: "SectionHeading", text: 'Projects' }),
          ...(resume.projects || []).flatMap(proj => [
            new Paragraph({
              style: "JobTitle",
              children: [
                new TextRun(proj.name),
                ...(proj.url ? [new TextRun({ text: `\t${proj.url}`, style: "Default" })] : []),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
            }),
            new Paragraph({ text: proj.description, spacing: { after: 60 } }),
            new Paragraph({ text: `Technologies: ${proj.technologies.join(', ')}` }),
            new Paragraph({ text: '' }), // Spacer
          ]),
        ] : []),

        // Custom Sections
        ...(resume.customSections || []).flatMap(sec => [
          new Paragraph({ style: "SectionHeading", text: sec.title }),
          new Paragraph({ text: sec.content }),
        ]),

        // Websites
        ...((resume.websites && resume.websites.length > 0) ? [
          new Paragraph({ style: "SectionHeading", text: 'Websites / Profiles' }),
          ...resume.websites.map(site => new Paragraph({
             children: [ new TextRun({ text: `${site.name}: ${site.url}`, style: "Hyperlink" }) ],
          })),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
};

    