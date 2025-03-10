import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { reportData, timestamp } = await request.json();
    
    // Create temporary HTML file for the report
    const htmlContent = generatePdfHtml(reportData);
    const tempDir = path.join(process.cwd(), 'tmp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const htmlPath = path.join(tempDir, `report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Launch puppeteer to generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    
    // Generate PDF with appropriate settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>', // Empty header
      footerTemplate: `
        <div style="width: 100%; font-size: 8px; padding: 0 1cm; color: #777; display: flex; justify-content: space-between;">
          <div>VOCA Report</div>
          <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
        </div>
      `,
      timeout: 30000,
    });
    
    // Clean up
    await browser.close();
    fs.unlinkSync(htmlPath);
    
    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="VOCA_Report_${timestamp.replace(/[:.]/g, "-")}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

// Function to generate HTML content for the PDF
function generatePdfHtml(report: any) {
  // Extract data from the report
  const sections = extractSections(report.gemini_output || '');
  const { strengths, weaknesses } = extractStrengthsWeaknesses(report.gemini_output || '');
  const grade = extractGrade(report.gemini_output || '');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VOCA Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: white;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 15px;
        }
        
        h1 {
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 24px;
          color: #1a202c;
        }
        
        h2 {
          font-size: 22px;
          font-weight: 600;
          margin-top: 30px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
          color: #2d3748;
        }
        
        h3 {
          font-size: 18px;
          font-weight: 600;
          margin-top: 16px;
          margin-bottom: 12px;
          color: #3182ce;
        }
        
        p {
          margin-bottom: 16px;
        }
        
        .summary-card {
          background-color: #ebf8ff;
          border-left: 4px solid #3182ce;
          border-radius: 4px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .summary-card h2 {
          border-bottom: none;
          margin-top: 0;
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        
        @media (max-width: 600px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        
        .card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          background-color: #fff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .strengths-card {
          background-color: #f0fff4;
          border-color: #9ae6b4;
        }
        
        .weaknesses-card {
          background-color: #fffbeb;
          border-color: #fbd38d;
        }
        
        .card-title {
          font-weight: 600;
          color: #718096;
          font-size: 14px;
          margin-bottom: 4px;
          text-transform: capitalize;
        }
        
        .card-value {
          font-weight: 600;
          font-size: 16px;
        }
        
        .meta-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }
        
        .meta-label {
          font-size: 14px;
          color: #718096;
        }
        
        .grade {
          font-size: 24px;
          font-weight: 700;
          color: #3182ce;
        }
        
        .date {
          font-weight: 500;
        }
        
        .analysis-card {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        /* Ensure proper page breaks */
        .page-break-before {
          page-break-before: always;
        }
        
        .page-break-after {
          page-break-after: always;
        }
        
        .no-break {
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>VOCA Analysis Report</h1>
        
        <!-- Summary Card -->
        <div class="summary-card">
          <h2>Executive Summary</h2>
          <p>
            This report provides a comprehensive analysis of your video presentation, 
            evaluating both audio and visual aspects to help improve your communication skills.
          </p>
          <div class="meta-info">
            <div>
              <div class="meta-label">Generated on</div>
              <div class="date">${new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <div class="meta-label">Overall Score</div>
              <div class="grade">${grade}</div>
            </div>
          </div>
        </div>
        
        <!-- Strengths & Weaknesses -->
        <h2>Strengths & Areas for Improvement</h2>
        <div class="grid no-break">
          <div class="card strengths-card">
            <h3>Strengths</h3>
            ${strengths.split('\n').map(item => 
              item.trim() ? `<p>${item}</p>` : ''
            ).join('')}
          </div>
          
          <div class="card weaknesses-card">
            <h3>Areas for Improvement</h3>
            ${weaknesses.split('\n').map(item => 
              item.trim() ? `<p>${item}</p>` : ''
            ).join('')}
          </div>
        </div>
        
        <!-- Audio Analysis -->
        <h2>Audio Analysis</h2>
        <div class="grid">
          ${report.audio_output ? 
            Object.entries(report.audio_output).map(([key, value]) => `
              <div class="card">
                <div class="card-title">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div class="card-value">${value}</div>
              </div>
            `).join('') : 
            '<p>No audio analysis data available</p>'
          }
        </div>
        
        <!-- Detailed Analysis -->
        <h2>Detailed Analysis</h2>
        ${sections.map(section => `
          <div class="analysis-card no-break">
            <h3>${section.title}</h3>
            ${section.content.split('\n').map(paragraph => 
              paragraph.trim() ? `<p>${paragraph}</p>` : ''
            ).join('')}
          </div>
        `).join('')}
        
        <!-- Visual Analysis -->
        <h2>Visual Presentation Analysis</h2>
        <div class="grid">
          ${report.video_output ? 
            Object.entries(report.video_output).map(([key, value]) => `
              <div class="card">
                <div class="card-title">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div class="card-value">${value}</div>
              </div>
            `).join('') : 
            '<p>No video analysis data available</p>'
          }
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper functions to extract data
function extractSections(text: string) {
  const sections = text.split('---').map(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    return { title, content };
  });
  return sections;
}

function extractStrengthsWeaknesses(text: string) {
  const strengths = text.match(/Strengths\s*([\s\S]*?)(?=Weaknesses)/)?.[1]?.trim() || 'No strengths mentioned';
  const weaknesses = text.match(/Weaknesses\s*([\s\S]*?)(?=Summary)/)?.[1]?.trim() || 'No weaknesses mentioned';
  return { strengths, weaknesses };
}

function extractGrade(text: string) {
  return text.match(/Grade:\n\n(\d+\/\d+)/)?.[1] || "N/A";
}