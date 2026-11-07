/**
 * High-Resolution PDF Export Service using jsPDF & html2canvas
 * Converts reports, dashboards, and charts into official PDF files
 * tailored to the school's visual identity with RTL support and print clarity.
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfExportOptions {
  fileName?: string;
  orientation?: 'portrait' | 'landscape';
  title?: string;
  margin?: number; // In mm: 0, 5, 10, 15, 20
  format?: 'a4' | 'letter';
}

export const PdfExportService = {
  /**
   * Export an HTML Element by DOM Node or ID to a PDF file
   */
  async exportElementToPdf(
    element: HTMLElement | string,
    options: PdfExportOptions = {}
  ): Promise<void> {
    const targetElement = typeof element === 'string'
      ? document.getElementById(element)
      : element;

    if (!targetElement) {
      throw new Error('العنصر المراد تصديره غير موجود');
    }

    const {
      fileName = `ecole_bekar_report_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation = 'portrait',
      margin = 10,
      format = 'a4'
    } = options;

    // Use html2canvas with 2x scale for crisp fonts & vector-like graphics
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: targetElement.scrollWidth,
      windowHeight: targetElement.scrollHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    const marginMm = Math.max(0, margin);
    const imgWidth = pageWidth - (marginMm * 2);
    const imgHeight = imgWidth / ratio;

    let heightLeft = imgHeight;
    let position = marginMm;

    // Add first page
    pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - (marginMm * 2));

    // Multi-page support if content is longer than paper
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + marginMm;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', marginMm, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - (marginMm * 2));
    }

    pdf.save(fileName);
  }
};
