import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (imagePath) => {
  try {
    console.log('Starting OCR extraction for:', imagePath);

    const dir = path.dirname(imagePath);
    const base = path.basename(imagePath, path.extname(imagePath));

    const processed1 = path.join(dir, `processed1_${base}.png`);
    const processed2 = path.join(dir, `processed2_${base}.png`);

    // Processed version 1: sharpened grayscale high-contrast
    await sharp(imagePath).resize(2000, null, { withoutEnlargement: true })
      .grayscale().normalize().linear(1.5, -20).median(2).sharpen()
      .png({ quality: 100 }).toFile(processed1);

    // Processed version 2: high-res binary threshold
    await sharp(imagePath).resize(3000, null, { withoutEnlargement: true })
      .grayscale().threshold(128).median(1)
      .png({ quality: 100 }).toFile(processed2);

    const configs = [processed1, processed2].map((path, i) => ({
      path,
      options: {
        logger: m => console.log(`OCR${i + 1} Progress:`, m.progress),
        tessedit_pageseg_mode: i === 0 ? Tesseract.PSM.SINGLE_BLOCK : Tesseract.PSM.AUTO,
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,/:-() '
      }
    }));

    let bestText = '', bestConfidence = 0;
    for (const { path, options } of configs) {
      try {
        const result = await Tesseract.recognize(path, 'eng', options);
        if (result.data.confidence > bestConfidence) {
          bestText = result.data.text;
          bestConfidence = result.data.confidence;
        }
      } catch (e) { console.error('OCR failed:', e); }
    }

    [processed1, processed2].forEach(p => fs.existsSync(p) && fs.unlinkSync(p));

    console.log('Best OCR confidence:', bestConfidence);
    return bestText;
  } catch (err) {
    console.error('OCR Extraction Error:', err);
    throw new Error('Failed to extract text from image');
  }
};

export const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log('Starting PDF text extraction for:', pdfPath);

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument({ data }).promise;

    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();

      // Sort items top-to-bottom then left-to-right
      const lines = [], items = [...content.items].sort((a, b) => {
        const yDiff = Math.abs(a.transform[5] - b.transform[5]);
        return yDiff > 2 ? b.transform[5] - a.transform[5] : a.transform[4] - b.transform[4];
      });

      let currY = null, currLine = [];
      for (const item of items) {
        const y = item.transform[5];
        if (currY === null || Math.abs(y - currY) <= 2) currLine.push(item);
        else { lines.push(currLine); currLine = [item]; }
        currY = y;
      }
      if (currLine.length) lines.push(currLine);

      // Merge text from same line
      for (const line of lines) {
        let lineText = '', lastX = null;
        for (const { str, transform, width } of line) {
          const x = transform[4];
          if (str.trim()) {
            if (lastX !== null) {
              const gap = x - lastX;
              lineText += gap > 20 ? '\t' : gap > 3 ? ' ' : '';
            }
            lineText += str.trim();
            lastX = x + (width || 0);
          }
        }
        fullText += lineText.trim() + '\n';
      }
    }

    return fullText;
  } catch (err) {
    console.error('PDF Parsing Error:', err);
    throw new Error('Failed to extract text from PDF');
  }
};

export const parseReceiptText = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  let amount = null;
  let merchantName = null;
  let date = null;
  const items = [];

  const amountPatterns = [
    /\bTOTAL[:\s]*\$?(\d+(?:\.\d{1,2})?)/i,
    /\btotal[:\s]*\$?(\d+(?:\.\d{1,2})?)/i
  ];

  // Extract merchant name from first clean line
  for (const line of lines) {
    if (
      line &&
      !line.toLowerCase().includes('item') &&
      !line.includes('$') &&
      !line.match(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/)
    ) {
      merchantName = line;
      break;
    }
  }

  // Try explicit TOTAL patterns
  for (const pattern of amountPatterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        amount = parseFloat(match[1]);
        break;
      }
    }
    if (amount) break;
  }

  // find highest dollar amount if TOTAL wasn't found
  if (!amount) {
    const dollarMatches = text.match(/\$(\d+(?:\.\d{1,2})?)/g);
    if (dollarMatches) {
      amount = Math.max(...dollarMatches.map(m => parseFloat(m.replace('$', ''))));
    }
  }

  // Extract date
  const dateMatch = text.match(/\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/);
  if (dateMatch) {
    const parsed = new Date(dateMatch[0]);
    if (!isNaN(parsed)) date = parsed;
  }

  // Extract item lines
  for (const line of lines) {
    const match = line.match(/(.+?)\s+\$\s*(\d+(?:\.\d{1,2})?)/);
    if (match) {
      const name = match[1].trim();
      const price = parseFloat(match[2]);
      if (!name.toLowerCase().includes('total') && price < 10000) {
        items.push({ name, amount: price });
      }
    }
  }

  return { amount, merchantName, date, items, rawText: text };
};

export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error deleting file:', err);
    return false;
  }
};

export const cleanupOldFiles = () => {
  try {
    const dir = 'uploads';
    const old = Date.now() - 30 * 24 * 60 * 60 * 1000;
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).mtime < old) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    });
  } catch (err) {
    console.error('Cleanup Error:', err);
  }
};
