import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfBlob = async (
  resumeElement: HTMLElement | null,
): Promise<Blob> => {
  if (!resumeElement) {
    throw new Error("Resume element not found for PDF generation.");
  }

  // Ensure fonts are fully loaded before capturing the canvas
  await document.fonts.ready;
  
  const canvas = await html2canvas(resumeElement, {
    scale: 3, // Higher scale for better quality
    useCORS: true,
    logging: false,
    width: resumeElement.scrollWidth,
    height: resumeElement.scrollHeight,
    windowWidth: resumeElement.scrollWidth,
    windowHeight: resumeElement.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  
  const ratio = canvasWidth / pdfWidth;
  const imgHeightInPdf = canvasHeight / ratio;

  let heightLeft = imgHeightInPdf;
  let position = 0;
  let page = 1;

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = -pdfHeight * page;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
    heightLeft -= pdfHeight;
    page++;
  }
  
  return pdf.output('blob');
};
