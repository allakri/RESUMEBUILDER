
import React from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ResumePreview } from '@/components/resume-preview';
import type { ResumeDataWithIds } from '@/ai/resume-schema';

export const generatePdfBlob = async (
  resumeData: ResumeDataWithIds,
  templateName: string,
  themeColor: string,
  fontPair: { body: string, headline: string }
): Promise<Blob> => {
  // 1. Create a hidden container for rendering the full-height resume
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px'; // Position off-screen
  container.style.width = '8.27in'; // Standard A4 width
  container.style.height = 'auto'; // Allow content to determine height
  container.style.background = 'white';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    // 2. Render the unconstrained resume preview into the hidden container
    await new Promise<void>((resolve) => {
      root.render(
        <ResumePreview
          resumeData={resumeData}
          templateName={templateName}
          isEditable={false} // Disable editing for print version
          style={{
            '--theme-color': themeColor,
            '--font-family-body': fontPair.body,
            '--font-family-headline': fontPair.headline,
          }}
        />
      );
      // Brief timeout to allow for rendering and layout calculation
      setTimeout(resolve, 300);
    });

    // Ensure all fonts are fully loaded before capturing the canvas
    await document.fonts.ready;

    // 3. Capture the entire hidden element with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2.5, // Increase scale for higher resolution and sharper text
      useCORS: true,
      logging: false,
    });

    // 4. Paginate the captured canvas into a multi-page A4 PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add subsequent pages if the content is longer than one page
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    return pdf.output('blob');

  } finally {
    // 5. Clean up by unmounting the React component and removing the container
    root.unmount();
    document.body.removeChild(container);
  }
};
