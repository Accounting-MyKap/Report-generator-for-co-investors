import { TableRow } from '../types.ts';
import { MYKAP_LOGO_URL } from '../constants.ts';
import { toTitleCase, parseCurrency, formatCurrency, parsePercent } from './formatters.ts';

/**
 * Fetches an image from a URL and converts it to a Base64 data URL.
 * @param url The URL of the image to fetch.
 * @returns A promise that resolves with the data URL.
 */
const getImageDataUrl = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error("Failed to fetch or process image for PDF:", error);
        reject(error);
      });
  });
};

export const generatePdf = async (
  title: string,
  headers: string[],
  data: TableRow[]
): Promise<void> => {
  try {
    const doc = new (window as any).jspdf.jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageMargin = 15;
    const contentWidth = pageWidth - (pageMargin * 2);

    // --- Header Section ---

    // 1. Blue Banner for the main title
    const blueBannerY = 4; // Reduced from 10 to move it up
    const blueBannerHeight = 20; // Slightly reduced height for compactness
    doc.setFillColor(37, 72, 199); // MyKap Blue from table header
    doc.rect(pageMargin, blueBannerY, contentWidth, blueBannerHeight, 'F');

    // 2. Title Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22); // Slightly smaller font for the new banner height
    doc.setTextColor(255, 255, 255);
    doc.text(title, pageWidth / 2, blueBannerY + blueBannerHeight / 2, { 
      align: 'center', 
      baseline: 'middle' 
    });
    
    // --- End of Header Section ---

    // The table starts below the blue banner with less space
    const tableStartY = blueBannerY + blueBannerHeight + 3; // Reduced space from 8 to 5
    
    // Prepare table data
    const tableData = data.map(row => 
      headers.map(header => {
        const lowerCaseHeader = header.toLowerCase();
        if (lowerCaseHeader === 'regular payment' || lowerCaseHeader === 'loan balance') {
          return formatCurrency(row[header]);
        }
        return row[header] ?? '';
      })
    );

    const columnsToAlignRight = ['Interest Rate', 'Maturity Date', 'Term Left', 'Regular Payment', 'Loan Balance', 'Percent Owned'].map(h => h.toLowerCase());
    const columnStyles: { [key: number]: any } = {};
    headers.forEach((header, index) => {
        if (columnsToAlignRight.includes(header.toLowerCase())) {
            columnStyles[index] = { halign: 'right' };
        }
    });

    // Calculate Totals
    const findHeader = (targetHeader: string) => headers.find(h => h.toLowerCase() === targetHeader.toLowerCase());
    
    const regularPaymentHeader = findHeader('Regular Payment');
    const loanBalanceHeader = findHeader('Loan Balance');
    const interestRateHeader = findHeader('Interest Rate');
    
    const regularPaymentTotal = regularPaymentHeader 
        ? data.reduce((acc, row) => acc + (parseCurrency(row[regularPaymentHeader]) || 0), 0)
        : 0;
    const loanBalanceTotal = loanBalanceHeader
        ? data.reduce((acc, row) => acc + (parseCurrency(row[loanBalanceHeader]) || 0), 0)
        : 0;
    const loanCount = data.length;
    
    let portfolioYield = 0;
    const hasInterestRate = !!interestRateHeader;
    if (hasInterestRate && loanCount > 0) {
      const totalInterestRate = data.reduce((acc, row) => acc + (parsePercent(row[interestRateHeader as string]) || 0), 0);
      portfolioYield = totalInterestRate / loanCount;
    }
    
    // Prepare footer row
    const findHeaderIndex = (targetHeader: string) => headers.findIndex(h => h.toLowerCase() === targetHeader.toLowerCase());
    const footerRow: any[] = new Array(headers.length).fill('');
    const regularPaymentIndex = findHeaderIndex('Regular Payment');
    const loanBalanceIndex = findHeaderIndex('Loan Balance');
    
    if (headers.length > 0) {
      footerRow[0] = { content: 'Totals', styles: { halign: 'left' }};
    }
    if (headers.length > 1 && hasInterestRate) {
      const yieldText = `Portfolio Yield: ${portfolioYield.toFixed(4)}% (${loanCount} loans)`;
      footerRow[1] = { content: yieldText, styles: { halign: 'left' } };
    }
    if (regularPaymentIndex !== -1) {
        footerRow[regularPaymentIndex] = { content: formatCurrency(regularPaymentTotal), styles: { halign: 'right' } };
    }
    if (loanBalanceIndex !== -1) {
        footerRow[loanBalanceIndex] = { content: formatCurrency(loanBalanceTotal), styles: { halign: 'right' } };
    }
    
    // Dynamic styling based on column count to fit on one page
    let fontSize = 9.5;
    let cellPadding = 2.5;
    const columnCount = headers.length;

    if (columnCount > 12) {
      fontSize = 7;
      cellPadding = 1.5;
    } else if (columnCount > 8) {
      fontSize = 8;
      cellPadding = 2;
    }

    // Generate table with professional styling
    (doc as any).autoTable({
      startY: tableStartY,
      head: [headers.map(toTitleCase)],
      body: tableData,
      foot: [footerRow],
      showFoot: 'lastPage', // Only show footer on the last page
      theme: 'striped', // Cleaner look without vertical lines
      headStyles: {
        fillColor: [37, 72, 199], // MyKap Blue
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      footStyles: {
        fillColor: [236, 239, 241], // Lighter gray for footer
        textColor: [44, 62, 80], // Dark gray text
        fontStyle: 'bold',
        lineWidth: { top: 0.5 }, // Thick top border
        lineColor: [44, 62, 80],
      },
      styles: {
        fontSize: fontSize,
        cellPadding: cellPadding,
        overflow: 'ellipsize',
        halign: 'left', // Default align left for all cells
      },
      // columnStyles overrides the default alignment for specific columns
      // It applies to all rows in that column, including the header
      columnStyles: columnStyles,
      alternateRowStyles: {
        fillColor: [248, 249, 250] // Very light gray for alternate rows
      },
      margin: { top: 2, bottom: 2, left: 15, right: 15 }
    });

    doc.save(`${title.replace(/\s/g, '_')}_informe.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Ocurrió un error al generar el PDF.");
  }
};