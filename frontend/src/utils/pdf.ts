import html2pdf from 'html2pdf.js';

export async function generateChallanPdfFromElement(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const options = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  await html2pdf().set(options).from(element).save();
}
