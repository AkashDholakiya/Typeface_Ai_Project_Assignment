import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

// Enhanced extract text from image using OCR with better preprocessing
export const extractTextFromImage = async (imagePath) => {
  try {
    console.log('Starting OCR extraction for:', imagePath);
    
    // Create multiple processed versions for better OCR
    const dir = path.dirname(imagePath);
    const basename = path.basename(imagePath, path.extname(imagePath));
    
    // Version 1: High contrast, denoised
    const processedPath1 = path.join(dir, `processed1_${basename}.png`);
    await sharp(imagePath)
      .resize(2000, null, { withoutEnlargement: true })
      .grayscale()
      .normalize()
      .linear(1.5, -20) // Increase contrast
      .median(2) // Denoise
      .sharpen({ sigma: 1, flat: 1, jagged: 2 })
      .png({ quality: 100 })
      .toFile(processedPath1);

    // Version 2: Higher resolution, threshold
    const processedPath2 = path.join(dir, `processed2_${basename}.png`);
    await sharp(imagePath)
      .resize(3000, null, { withoutEnlargement: true })
      .grayscale()
      .threshold(128) // Binary threshold
      .median(1)
      .png({ quality: 100 })
      .toFile(processedPath2);

    console.log('Image preprocessing completed');

    // Try OCR with different configurations
    const ocrConfigs = [
      {
        path: processedPath1,
        options: {
          logger: m => console.log('OCR1 Progress:', m.progress),
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,/:-() ',
        }
      },
      {
        path: processedPath2,
        options: {
          logger: m => console.log('OCR2 Progress:', m.progress),
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz$.,/:-() ',
        }
      }
    ];

    let bestResult = '';
    let bestConfidence = 0;

    for (const config of ocrConfigs) {
      try {
        console.log('Running OCR on:', config.path);
        const result = await Tesseract.recognize(config.path, 'eng', config.options);
        
        console.log('OCR confidence:', result.data.confidence);
        console.log('OCR text length:', result.data.text.length);
        
        if (result.data.confidence > bestConfidence || bestResult === '') {
          bestResult = result.data.text;
          bestConfidence = result.data.confidence;
        }
      } catch (error) {
        console.error('OCR failed for config:', error);
      }
    }

    // Clean up processed images
    [processedPath1, processedPath2].forEach(path => {
      try {
        if (fs.existsSync(path)) fs.unlinkSync(path);
      } catch (e) {
        console.error('Error cleaning up:', e);
      }
    });

    console.log('Best OCR confidence:', bestConfidence);
    console.log('Extracted text preview:', bestResult.substring(0, 200));
    
    return bestResult;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
};

// Enhanced parse receipt text to extract transaction details
export const parseReceiptText = (text) => {  console.log('Parsing receipt text:', text.substring(0, 500));
  console.log('All possible amounts found:');
  
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log('Lines to process:', lines);
  
  let amount = null;
  let merchantName = '';
  let date = null;
  let items = [];  
  const amountPatterns = [
    /\bTOTAL:\s*\$?(\d+(?:\.\d{2})?)/i,
    // Highest priority: "TOTAL: $37.40"
    /\btotal[:\s]*\$?(\d+(?:\.\d{2})?)/i,      
    // General total pattern
    /grand\s*total[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /final[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /amount[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /balance[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /due[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /charge[:\s]*\$?(\d+(?:\.\d{2})?)/i
  ];

  // Look for the final total amount more intelligently
  let possibleAmounts = [];
  // Search for amounts in text using individual patterns with priority
  for (let i = 0; i < amountPatterns.length; i++) {
    const pattern = amountPatterns[i];
    const globalPattern = new RegExp(pattern.source, pattern.flags + 'g');
    const matches = [...text.matchAll(globalPattern)];
      for (const match of matches) {
      const numStr = match[1];
      const num = parseFloat(numStr);
      const context = match[0].toLowerCase();
      const fullContext = text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10).toLowerCase();
      
      // Skip SUBTOTAL - it's not the final total
      if (context.includes('subtotal') || fullContext.includes('subtotal')) {
        console.log('Skipping SUBTOTAL:', match[0], 'Full context:', fullContext);
        continue;
      }
      
      if (!isNaN(num) && num > 0 && num < 10000) {
        const isActualTotal = (context.includes('total') && !context.includes('subtotal')) || 
                              context.includes('grand total') || 
                              context.includes('final');
        
        possibleAmounts.push({
          amount: num,
          context: match[0],
          priority: i, // Earlier patterns have higher priority
          isTotal: isActualTotal
        });
        console.log(`Found amount with pattern ${i}: ${match[0]} = $${num}, isTotal: ${isActualTotal}`);
      }
    }
  }
  
  // Also look for standalone dollar amounts but with lower priority
  const dollarMatches = text.match(/\$(\d+(?:\.\d{2})?)/g);
  if (dollarMatches) {
    dollarMatches.forEach((match, index) => {
      const num = parseFloat(match.substring(1));
      if (!isNaN(num) && num > 0 && num < 10000) {
        const position = text.indexOf(match);
        const beforeMatch = text.substring(Math.max(0, position - 30), position).toLowerCase();
        const afterMatch = text.substring(position, position + match.length + 30).toLowerCase();
        
        // Skip if this is clearly a subtotal
        if (beforeMatch.includes('subtotal') || afterMatch.includes('subtotal')) {
          console.log('Skipping subtotal amount:', match);
          return;
        }
        
        // Check if this amount might be a total based on context
        const contextIndicatesTotal = beforeMatch.includes('total') || 
                                     beforeMatch.includes('due') || 
                                     beforeMatch.includes('charge') ||
                                     afterMatch.includes('total') ||
                                     afterMatch.includes('due');
        
        possibleAmounts.push({
          amount: num,
          context: match,
          position: position,
          priority: contextIndicatesTotal ? 5 : 10, // Higher priority if context suggests total
          isTotal: contextIndicatesTotal
        });
        console.log(`Found standalone amount: ${match} = $${num}, isTotal: ${contextIndicatesTotal}`);
      }
    });
  }
  // Sort by priority (lower is better), then by isTotal, then by amount
  possibleAmounts.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.isTotal && !b.isTotal) return -1;
    if (!a.isTotal && b.isTotal) return 1;
    return b.amount - a.amount;
  });
  
  if (possibleAmounts.length > 0) {
    // Check if any amount has "total" in its context
    const totalAmount = possibleAmounts.find(amt => amt.isTotal);
    
    if (totalAmount) {
      // If we found an explicit total, use it
      amount = totalAmount.amount;
      console.log('Found explicit total amount:', totalAmount);
    } else {
      // If no explicit total found, select the maximum amount (likely the total)
      const maxAmount = Math.max(...possibleAmounts.map(amt => amt.amount));
      const maxAmountObj = possibleAmounts.find(amt => amt.amount === maxAmount);
      amount = maxAmount;
      console.log('No explicit total found, selecting maximum amount:', maxAmountObj);
    }
    
    console.log('All possible amounts:', possibleAmounts);
    console.log('Final selected amount:', amount);
  } else {
    console.log('No amounts found');
  }

  // Extract merchant name (improved logic)
  const businessKeywords = ['llc', 'inc', 'corp', 'ltd', 'store', 'shop', 'market', 'restaurant', 'cafe'];
  
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (line.length > 2 && line.length < 50 && 
        !line.match(/^\d/) && 
        !line.toLowerCase().includes('receipt') &&
        !line.toLowerCase().includes('invoice') &&
        !line.toLowerCase().includes('total') &&
        !line.match(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/) &&
        !line.includes('$') &&
        (businessKeywords.some(keyword => line.toLowerCase().includes(keyword)) || 
         line.match(/^[A-Z][A-Z\s&]+$/) || 
         i === 0)) {
      merchantName = line;
      break;
    }
  }

  // Enhanced date extraction
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{2,4}/i
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
        date = parsedDate;
        break;
      }
    }
  }  
  
  lines.forEach((line, lineIndex) => {
    
    // Format 1: Lines with explicit dollar amounts (e.g., "sample2 $19")
    const dollarMatch = line.match(/(.+?)\s*\$(\d+(?:\.\d{2})?)\s*$/);
    if (dollarMatch) {
      const itemName = dollarMatch[1].trim();
      const itemAmount = parseFloat(dollarMatch[2]);
      
      
      if (itemName && 
          !itemName.toLowerCase().includes('total') &&
          !itemName.toLowerCase().includes('tax') &&
          !itemName.toLowerCase().includes('subtotal') &&
          !itemName.toLowerCase().includes('discount') &&
          itemName.length > 1 && 
          itemName.length < 100 &&
          !isNaN(itemAmount) && 
          itemAmount > 0 && 
          itemAmount < 1000) {
        
        items.push({
          name: itemName,
          amount: itemAmount
        });
      }
    }
    
    // Format 2: Check if the line contains a "$" symbol anywhere (e.g., "product $15.00" or "$15 product")
    else if (line.includes('$')) {
      const dollarAnywhereMatch = line.match(/(.+?)[\s\$]*(\d+(?:\.\d{2})?)/);
      if (dollarAnywhereMatch) {
        const itemName = dollarAnywhereMatch[1].replace(/\$/g, '').trim();
        const itemAmount = parseFloat(dollarAnywhereMatch[2]);
        
        console.log(`Found dollar symbol in line: "${itemName}" = $${itemAmount}`);
        
        if (itemName && 
            !itemName.toLowerCase().includes('total') &&
            !itemName.toLowerCase().includes('tax') &&
            !itemName.toLowerCase().includes('subtotal') &&
            !itemName.toLowerCase().includes('discount') &&
            itemName.length > 1 && 
            itemName.length < 100 &&
            !isNaN(itemAmount) && 
            itemAmount > 0 && 
            itemAmount < 1000) {
          
          items.push({
            name: itemName,
            amount: itemAmount
          });
        }
      }
    }
    // Format 3: Lines with numbers at the end but NO dollar symbol - interpret as dollars directly
    else {
      const numberMatch = line.match(/(.+?)\s+(\d+(?:\.\d{2})?)\s*$/);
      if (numberMatch) {
        const itemName = numberMatch[1].trim();
        const rawNumber = numberMatch[2];
        const itemAmount = parseFloat(rawNumber);
        
        console.log(`Found number format (no $ symbol): "${itemName}" = ${itemAmount}`);
        
        // For numbers without $ symbol, interpret them as dollars directly
        // Special case: if it's a 3-digit number like "515", treat as $15 (remove leading digit if > 100)
        let finalAmount = itemAmount;
        if (!rawNumber.includes('.') && itemAmount >= 100 && itemAmount < 1000) {
          // Convert 3-digit numbers like 515 -> 15, 1299 -> 29, etc.
          const amountStr = itemAmount.toString();
          if (amountStr.length === 3) {
            finalAmount = parseFloat(amountStr.substring(1)); // Remove first digit
          }
        }
        
        console.log(`Final interpreted amount: $${finalAmount}`);
        
        if (itemName && 
            !itemName.toLowerCase().includes('total') &&
            !itemName.toLowerCase().includes('tax') &&
            !itemName.toLowerCase().includes('subtotal') &&
            !itemName.toLowerCase().includes('discount') &&
            !itemName.toLowerCase().includes('card') &&
            !itemName.toLowerCase().includes('receipt') &&
            itemName.length > 3 && 
            itemName.length < 100 &&
            !isNaN(finalAmount) && 
            finalAmount > 0 && 
            finalAmount < 1000) {
          
          items.push({
            name: itemName,
            amount: finalAmount
          });
        }
      }
    }
  });

  // Remove duplicate items
  const uniqueItems = [];
  items.forEach(item => {
    const exists = uniqueItems.find(ui => ui.name === item.name && ui.amount === item.amount);
    if (!exists) {
      uniqueItems.push(item);
    }
  });

  console.log('Parsed result:', { amount, merchantName, date, itemsCount: uniqueItems.length });

  return { 
    amount,
    merchantName,
    date,
    items: uniqueItems,
    rawText: text
  };
};

export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export const cleanupOldFiles = () => {
  const uploadsDir = 'uploads';
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    const files = fs.readdirSync(uploadsDir);
    
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old file: ${file}`);
      }
    });
  } catch (error) {    
    console.error('Error cleaning up old files:', error);
  }
};

// Extract text from PDF using pdf-parse
export const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log('Starting PDF text extraction for:', pdfPath);
    
    // Dynamic import to avoid module loading issues
    const { default: pdfParse } = await import('pdf-parse');
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
     
    // Parse the PDF
    const data = await pdfParse(pdfBuffer);
    
    console.log('PDF parsing completed');
    console.log(`- Pages: ${data.numpages}`);
    console.log(`- Text length: ${data.text.length}`);
    console.log('First 200 characters:', data.text.substring(0, 200));
    
    if (!data.text.trim()) {
      console.log('No text found in PDF, attempting OCR fallback...');
      return await extractTextFromPDFViaOCR(pdfPath);
    }
    
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    
    // If PDF parsing fails, try OCR fallback
    console.log('PDF parsing failed, attempting fallback to OCR...');
    try {
      return await extractTextFromPDFViaOCR(pdfPath);
    } catch (ocrError) {
      console.error('OCR fallback also failed:', ocrError);
      throw new Error('Failed to extract text from PDF using both direct parsing and OCR');
    }
  }
};

const extractTextFromPDFViaOCR = async (pdfPath) => {
  try {
    console.log('Attempting OCR extraction from PDF:', pdfPath);
    
    try {
      const pdf2pic = await import('pdf2pic');
      
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 300,           
        saveFilename: "temp_page",
        savePath: path.dirname(pdfPath),
        format: "png",
        width: 2000,
        height: 2000
      });
      
      const result = await convert(1, { responseType: "image" });
      const imagePath = result.path;
      
      console.log('PDF converted to image:', imagePath);
      
      const extractedText = await extractTextFromImage(imagePath);
      
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temporary image:', cleanupError);
      }
      
      return extractedText;
    } catch (pdf2picError) {
      console.error('pdf2pic not available or failed:', pdf2picError);
      throw new Error('PDF OCR fallback not available. Please convert PDF to image manually.');
    }
  } catch (error) {
    console.error('OCR fallback failed:', error);
    throw error;
  }
};
 