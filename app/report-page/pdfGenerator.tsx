// PDFGenerator.ts - Updated with robust content management and pagination to avoid overlapping content

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import axios from "axios";

// Define types
interface PDFGeneratorOptions {
  margin: number;
  headerHeight: number;
  footerHeight: number;
  pageWidth: number;
  pageHeight: number;
  contentSpacing: number;
  sectionSpacing: number;
  borderColor: number[];
  borderWidth: number;
  primaryColor: number[];
  secondaryColor: number[];
  footerMargin: number; // Added to control space before footer
}

interface ShareableLinks {
  pdfLink: string;
  txLink: string;
}

interface ReportInfo {
  name: string;
  topic: string;
}

// PDF Generator class for handling all PDF operations
export class PDFGenerator {
  private pdf: jsPDF;
  private options: PDFGeneratorOptions;
  private currentY: number;
  private report: any;
  private pageCount: number = 1;
  private reportInfo: ReportInfo = { name: "", topic: "" };

  constructor(report: any, options?: Partial<PDFGeneratorOptions>) {
    this.report = report;
    
    // Default options (A4 format) with improved spacing and border settings
    this.options = {
      margin: 20,
      headerHeight: 25,
      footerHeight: 15,
      footerMargin: 20, // Space to leave before footer
      pageWidth: 210, // mm (A4 width)
      pageHeight: 297, // mm (A4 height)
      contentSpacing: 10,
      sectionSpacing: 15,
      borderColor: [230, 230, 230],
      borderWidth: 0.3,
      primaryColor: [41, 121, 255],
      secondaryColor: [15, 82, 186],
      ...options
    };

    // Initialize PDF with A4 format
    this.pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Start position after header and margin
    this.currentY = this.options.margin + this.options.headerHeight;
    
    // Add event handler for new pages
    this.pdf.setPage(1);
    this.pdf.internal.events.subscribe('addPage', () => {
      this.pageCount++;
      this.drawHeader();
      this.drawFooter();
      // Reset Y position after adding a new page
      this.currentY = this.options.margin + this.options.headerHeight;
    });
  }

  // Generate a complete PDF based on the report data
  public async generatePDF(): Promise<{ pdfBlob: Blob; filename: string }> {
    // Fetch user name and topic from endpoints
    await this.fetchReportInfo();
    
    // Initial setup
    this.drawHeader();
    this.drawFooter();
    
    // Add report info section at the top
    this.addReportInfoSection();
    
    // Add content based on report structure
    await this.addReportContent();
    
    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `VOCA_Report_${timestamp}.pdf`;
    
    // Return the PDF blob and filename
    const pdfBlob = this.pdf.output("blob");
    return { pdfBlob, filename };
  }

  // Fetch user name and topic from endpoints
  private async fetchReportInfo(): Promise<void> {
    try {
      const [nameResponse, topicResponse] = await Promise.all([
        axios.get('/api/currentusername'),
        axios.get('/api/topic')
      ]);
      
      this.reportInfo = {
        name: nameResponse.data || "Not available",
        topic: topicResponse.data || "Not available"
      };
    } catch (error) {
      console.error("Failed to fetch report info:", error);
      this.reportInfo = {
        name: "Not available",
        topic: "Not available"
      };
    }
  }

  // Add report info section at the top
  private addReportInfoSection(): void {
    const infoSectionHeight = 30;
    
    // Check if we need a new page first
    this.checkAndAddPage(infoSectionHeight + this.options.contentSpacing);
    
    // Draw border around the info section
    this.pdf.setDrawColor(...this.options.borderColor);
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.setLineWidth(this.options.borderWidth);
    this.pdf.roundedRect(
      this.options.margin,
      this.currentY,
      this.options.pageWidth - (this.options.margin * 2),
      infoSectionHeight,
      2, 2, 'FD'
    );
    
    // Add name and topic information with more space
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.text("Name:", this.options.margin + 5, this.currentY + 12);
    this.pdf.text("Topic:", this.options.margin + 5, this.currentY + 22);
    
    this.pdf.setFont("helvetica", "normal");
    this.pdf.text(this.reportInfo.name, this.options.margin + 30, this.currentY + 12);
    this.pdf.text(this.reportInfo.topic, this.options.margin + 30, this.currentY + 22);
    
    this.currentY += infoSectionHeight + this.options.contentSpacing;
  }

  // Draw clean, minimalistic header
  private drawHeader(): void {
    const currentPage = this.pdf.internal.getCurrentPageInfo().pageNumber;
    
    // Create a clean header with subtle border
    this.pdf.setDrawColor(...this.options.borderColor);
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.setLineWidth(this.options.borderWidth);
    this.pdf.roundedRect(
      this.options.margin, 
      this.options.margin, 
      this.options.pageWidth - (this.options.margin * 2), 
      this.options.headerHeight,
      2, 2, 'FD'
    );
    
    // Add VOCA title with subtle gradient effect
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(...this.options.primaryColor);
    this.pdf.text("VOCA", this.options.margin + 5, this.options.margin + 11);
    
    // Add "Report" text
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text("Report", this.options.margin + 26, this.options.margin + 11);
    
    // Add date on the right
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(80, 80, 80);
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const dateWidth = this.pdf.getTextWidth(date);
    this.pdf.text(
      date, 
      this.options.pageWidth - this.options.margin - dateWidth - 6, 
      this.options.margin + 11
    );
    
    // Add page number
    const pageText = `Page ${currentPage} of ${this.pageCount}`;
    const pageTextWidth = this.pdf.getTextWidth(pageText);
    this.pdf.text(
      pageText,
      this.options.pageWidth - this.options.margin - pageTextWidth - 6,
      this.options.margin + 18
    );
  }

  // Draw clean, minimal footer
  private drawFooter(): void {
    this.pdf.setDrawColor(...this.options.borderColor);
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.setLineWidth(this.options.borderWidth);
    this.pdf.roundedRect(
      this.options.margin, 
      this.options.pageHeight - this.options.margin - this.options.footerHeight, 
      this.options.pageWidth - (this.options.margin * 2), 
      this.options.footerHeight,
      2, 2, 'FD'
    );
    
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text(
      "This report is secured on blockchain.",
      this.options.margin + 6,
      this.options.pageHeight - this.options.margin - this.options.footerHeight + 9
    );
  }

  // Check if there's enough space for content of a given height
  private checkAndAddPage(requiredHeight: number): void {
    // Calculate space needed, including safe margin before footer
    const footerPosition = this.options.pageHeight - this.options.margin - this.options.footerHeight - this.options.footerMargin;
    const availableHeight = footerPosition - this.currentY;
    
    if (availableHeight < requiredHeight) {
      this.pdf.addPage();
    }
  }

  // Get the maximum Y position where content can be placed (with footer consideration)
  private getMaxContentY(): number {
    return this.options.pageHeight - this.options.margin - this.options.footerHeight - this.options.footerMargin;
  }

  // Add a section title with clean, minimal styling
  private addSectionTitle(title: string): void {
    const titleHeight = 14;
    const sectionTitleBox = 20;
    
    this.checkAndAddPage(sectionTitleBox + this.options.contentSpacing);
    
    // Add space before the title
    this.currentY += this.options.sectionSpacing;
    
    // Draw section title box without border for cleaner look
    this.pdf.setFillColor(248, 250, 255);
    this.pdf.roundedRect(
      this.options.margin,
      this.currentY - 10,
      this.options.pageWidth - (this.options.margin * 2),
      sectionTitleBox,
      2, 2, 'F'
    );
    
    // Add a subtle accent line
    this.pdf.setDrawColor(...this.options.primaryColor);
    this.pdf.setLineWidth(0.8);
    this.pdf.line(
      this.options.margin, 
      this.currentY - 5, 
      this.options.margin + 5, 
      this.currentY - 5
    );
    
    // Draw the title with clean styling
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(...this.options.secondaryColor);
    this.pdf.text(title, this.options.margin + 10, this.currentY);
    
    this.currentY += titleHeight;
  }

  // Add a sub-section title with minimal styling
  private addSubSectionTitle(title: string): void {
    const titleHeight = 12;
    const subSectionTitleBox = 12;
    
    this.checkAndAddPage(subSectionTitleBox + this.options.contentSpacing);
    
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(70, 70, 70);
    this.pdf.text(title, this.options.margin, this.currentY);
    
    this.currentY += titleHeight;
  }

  // Add a paragraph of text with proper line breaks and clean formatting
  private addParagraph(text: string, fontSize: number = 11, addBorder: boolean = false): void {
    if (!text) return; // Skip empty paragraphs
    
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(60, 60, 60);
    
    const availableWidth = this.options.pageWidth - (this.options.margin * 2) - (addBorder ? 10 : 0);
    const lines = this.pdf.splitTextToSize(text, availableWidth);
    
    const lineHeight = fontSize * 0.352778; // convert pt to mm
    const textHeight = lines.length * lineHeight * 1.5;
    const paragraphHeight = textHeight + (addBorder ? 10 : 0);
    
    this.checkAndAddPage(paragraphHeight + this.options.contentSpacing);
    
    // Draw border around paragraph if requested (using minimal styling)
    if (addBorder) {
      this.pdf.setDrawColor(...this.options.borderColor);
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.setLineWidth(this.options.borderWidth);
      this.pdf.roundedRect(
        this.options.margin,
        this.currentY - 5,
        this.options.pageWidth - (this.options.margin * 2),
        paragraphHeight,
        2, 2, 'FD'
      );
      
      // Add text with padding
      this.pdf.text(lines, this.options.margin + 5, this.currentY);
    } else {
      // Add text without padding
      this.pdf.text(lines, this.options.margin, this.currentY);
    }
    
    this.currentY += paragraphHeight + this.options.contentSpacing;
  }

  // Add a clean, minimal bullet point
  private addBulletPoint(text: string, fontSize: number = 11, indent: number = 5): void {
    if (!text) return; // Skip empty bullet points
    
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setFontSize(fontSize);
    this.pdf.setTextColor(60, 60, 60);
    
    const availableWidth = this.options.pageWidth - (this.options.margin * 2) - indent - 10;
    const lines = this.pdf.splitTextToSize(text, availableWidth);
    
    const lineHeight = fontSize * 0.352778; // convert pt to mm
    const textHeight = lines.length * lineHeight * 1.5;
    
    this.checkAndAddPage(textHeight + 5);
    
    // Draw minimal bullet point
    this.pdf.setFillColor(...this.options.primaryColor);
    this.pdf.circle(
      this.options.margin + 2, 
      this.currentY - lineHeight / 2 + 3, 
      0.8, 
      'F'
    );
    
    // Add indented text
    this.pdf.text(lines, this.options.margin + indent, this.currentY);
    
    this.currentY += textHeight + 5;
  }

  // Add a clean, minimal table
  private addTable(headers: string[], data: string[][]): void {
    if (!data || data.length === 0) return; // Skip empty tables
    
    const rowHeight = 10;
    const estimatedHeight = (data.length + 1) * rowHeight + this.options.contentSpacing;
    
    this.checkAndAddPage(estimatedHeight);
    
    // Store current Y position to check after table rendering
    const startY = this.currentY;
    
    autoTable(this.pdf, {
      head: [headers],
      body: data,
      startY: this.currentY,
      margin: { left: this.options.margin, right: this.options.margin, top: 10 },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineColor: this.options.borderColor,
        lineWidth: this.options.borderWidth,
      },
      headStyles: {
        fillColor: [...this.options.primaryColor],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 255],
      },
      // Removed didDrawPage callback here to prevent duplicate header/footer rendering
      tableLineWidth: this.options.borderWidth,
      tableLineColor: this.options.borderColor
    });
    
    // @ts-ignore - jspdf-autotable adds this property
    this.currentY = this.pdf.lastAutoTable.finalY + this.options.contentSpacing;
  }

  // Format analysis data with clean presentation
  private formatAnalysisData(data: any, titlePrefix: string = ""): string[][] {
    if (!data) return [];
    
    return Object.entries(data)
      .map(([key, value]) => {
        // Skip items that will be handled separately
        if (key === "Overall Confidence Report" || 
            key === "Summary" || 
            key === "Grade" ||
            typeof value === 'object') {
          return null;
        }
        
        // Format key for better readability
        const formattedKey = titlePrefix + key
          .replace(/_/g, ' ')
          .replace(/\(/g, ' (')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        // Format value for better display
        let formattedValue = value ? value.toString() : "N/A";
        
        return [formattedKey, formattedValue];
      })
      .filter(item => item !== null) as string[][];
  }

  // Add key insight section with clean design and proper text wrapping
  private addKeyInsightSection(title: string, content: string): void {
    if (!content) return; // Skip if content is empty
    
    const fontSize = 11;
    const lineHeight = fontSize * 0.352778;
    
    // Calculate the space needed for the title and content
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setFontSize(fontSize);
    
    // Calculate space for content with proper wrapping
    const availableWidth = this.options.pageWidth - (this.options.margin * 2) - 5;
    const contentLines = this.pdf.splitTextToSize(content.trim(), availableWidth);
    const contentHeight = contentLines.length * lineHeight * 1.5 + 10; // Extra padding
    
    // Check if we need to add a new page
    const totalHeight = lineHeight * 1.5 + contentHeight;
    this.checkAndAddPage(totalHeight);
    
    // First render the title
    this.pdf.setTextColor(40, 40, 40);
    this.pdf.text(`${title}:`, this.options.margin, this.currentY);
    this.currentY += lineHeight * 1.5; // Add space after the title
    
    // Then render the content with proper indentation and text wrapping
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(60, 60, 60);
    
    // Add a border around the content for better visual separation
    this.pdf.setDrawColor(...this.options.borderColor);
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.setLineWidth(this.options.borderWidth);
    this.pdf.roundedRect(
      this.options.margin,
      this.currentY - lineHeight,
      this.options.pageWidth - (this.options.margin * 2),
      contentHeight,
      2, 2, 'FD'
    );
    
    // Render text with padding inside the box
    this.pdf.text(contentLines, this.options.margin + 5, this.currentY);
    
    // Update current position
    this.currentY += contentHeight + this.options.contentSpacing;
  }

  // Process gemini output with clean formatting
  private processGeminiOutput(content: string): void {
    if (!content) return;
    
    let summaryContent = "";
    let gradeContent = "";
    
    // Extract summary and grade from content
    const summaryMatch = content.match(/Summary:\s*([\s\S]*?)(---|$)/);
    if (summaryMatch && summaryMatch[1]) {
      summaryContent = summaryMatch[1].trim();
    }
    
    const gradeMatch = content.match(/Grade:\s*([\s\S]*?)$/);
    if (gradeMatch && gradeMatch[1]) {
      gradeContent = gradeMatch[1].trim();
    }
    
    // Start with clean sections
    this.addSectionTitle("Content Analysis");
    
    // Split the content on section markers (---)
    const sections = content.split('---').map(s => s.trim());
    
    sections.forEach((section, index) => {
      if (!section) return;
      
      // Skip summary and grade sections - we'll handle them separately
      if (section.includes("Summary:") || section.includes("Grade:")) {
        return;
      }
      
      // Find headings (both markdown style and plain)
      const headingMatch = section.match(/^#+\s+(.+)$|^([^:\n]+)$/m);
      
      if (headingMatch) {
        const headingText = (headingMatch[1] || headingMatch[2]).trim();
        this.addSubSectionTitle(headingText);
        
        // Get the content after the heading
        let contentText = section.replace(/^#+\s+(.+)$|^([^:\n]+)$/m, '').trim();
        
        // Process bullet points
        if (contentText.includes('*')) {
          const bullets = contentText.split('*').map(b => b.trim()).filter(b => b);
          bullets.forEach(bullet => {
            this.addBulletPoint(bullet);
          });
        } else if (contentText) {
          this.addParagraph(contentText, 11, false);
        }
      } else {
        // If no heading is found, treat as a paragraph
        this.addParagraph(section, 11, false);
      }
    });
    
    // Add summary and grade sections at the end with clean formatting
    // Make sure we have enough space, considering these are important sections
    const summaryAndGradeEstimatedHeight = 80; // Rough estimate
    if (this.currentY + summaryAndGradeEstimatedHeight > this.getMaxContentY()) {
      this.pdf.addPage();
    }
    
    this.addSectionTitle("Performance Summary");
    
    if (summaryContent) {
      this.addKeyInsightSection("Summary", summaryContent);
    }
    
    if (gradeContent) {
      this.addKeyInsightSection("Grade", gradeContent);
    }
  }

  // Main method to build the report content based on the JSON structure
  private async addReportContent(): Promise<void> {
    if (!this.report) {
      throw new Error("No report data provided");
    }

    // Add Audio Analysis Section if available
    if (this.report.audio_output) {
      this.addSectionTitle("Audio Analysis");
      
      const audioData = this.formatAnalysisData(this.report.audio_output);
      this.addTable(["Audio Metric", "Score"], audioData);
    }
    
    // Add Confidence Report if it exists (but skip the main Video Analysis section)
    if (this.report.video_output && this.report.video_output["Overall Confidence Report"]) {
      this.addSectionTitle("Presentation Skills");
      
      // Format the video data excluding overall report
      const videoData = this.formatAnalysisData(this.report.video_output);
      this.addTable(["Visual Metric", "Score"], videoData);
      
      // Add the confidence report as a separate insight section
      this.addSubSectionTitle("Confidence Assessment");
      this.addParagraph(this.report.video_output["Overall Confidence Report"].toString(), 11, false);
    }
    
    // Add Gemini AI Analysis Section - always start on a new page for clarity
    if (this.report.gemini_output) {
      this.pdf.addPage();
      this.processGeminiOutput(this.report.gemini_output.toString());
    }
  }
}

// Helper function to generate PDF from report data
export async function generatePDFFromReport(reportData: any): Promise<{ pdfBlob: Blob; filename: string }> {
  const generator = new PDFGenerator(reportData);
  return await generator.generatePDF();
}

// Helper function to upload PDF and mint NFT
export async function uploadAndMintNFT(
  pdfBlob: Blob, 
  filename: string, 
  uploadPdfToIPFS: (pdfBlob: Blob, filename: string) => Promise<string>,
  createAndUploadMetadata: (pdfCid: string, documentName: string, description: string) => Promise<string>,
  mintDocument: (metadataCid: string) => Promise<any>
): Promise<ShareableLinks> {
  // Upload PDF to IPFS and get the PDF CID
  const pdfCid = await uploadPdfToIPFS(pdfBlob, filename);
  
  // Create metadata and mint NFT
  const documentName = filename;
  const description = `PDF document uploaded at ${new Date().toLocaleString()}`;
  const metadataCid = await createAndUploadMetadata(pdfCid, documentName, description);
  const mintResult = await mintDocument(metadataCid);
  
  // Construct shareable links
  const pdfLink = `https://ipfs.io/ipfs/${pdfCid}`;
  const txLink = `https://www.oklink.com/amoy/tx/${mintResult.transactionHash}`;
  
  return { pdfLink, txLink };
}
