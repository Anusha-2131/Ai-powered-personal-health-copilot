const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

/**
 * Extracts raw text from uploaded PDF or Image file
 * @param {string} filePath - Absolute path to uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{ text: string, confidence: number, sourceMethod: string, isScanned: boolean }>}
 */
async function extractTextFromFile(filePath, mimeType) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // PDF extraction
    if (mimeType === 'application/pdf' || filePath.toLowerCase().endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const extractedText = (pdfData.text || '').trim();

      if (extractedText.length > 30) {
        return {
          text: extractedText,
          confidence: 96,
          sourceMethod: 'pdf_text_layer',
          isScanned: false
        };
      }

      return {
        text: extractedText || '[Notice: PDF appears to be a scanned image with minimal text layer. Please review or paste document text.]',
        confidence: 45,
        sourceMethod: 'pdf_text_minimal',
        isScanned: true
      };
    }

    // Image extraction (PNG, JPEG, WebP)
    if (
      mimeType.startsWith('image/') ||
      ['.png', '.jpg', '.jpeg', '.webp'].some(ext => filePath.toLowerCase().endsWith(ext))
    ) {
      console.log(`[OCR] Running Tesseract OCR on image: ${filePath}...`);
      const { data } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text' && m.progress % 0.25 === 0) {
            console.log(`[OCR Progress] ${(m.progress * 100).toFixed(0)}%`);
          }
        }
      });

      const cleanedText = (data.text || '').trim();
      const avgConfidence = Math.round(data.confidence || 75);

      return {
        text: cleanedText,
        confidence: Math.max(30, Math.min(avgConfidence, 98)),
        sourceMethod: 'tesseract_ocr',
        isScanned: true
      };
    }

    // Default plain text
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    return {
      text: rawContent,
      confidence: 90,
      sourceMethod: 'plain_text',
      isScanned: false
    };
  } catch (error) {
    console.error('[OCR Error]', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

module.exports = {
  extractTextFromFile
};