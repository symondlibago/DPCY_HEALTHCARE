import { jsPDF } from 'jspdf';

// -----------------------------------------------------------------------------
// Center details printed on every official receipt.
// Edit these to match your registered business info.
// -----------------------------------------------------------------------------
export const CENTER_INFO = {
  name: 'DPCY HEALTHCARE',
  tagline: 'Diagnostic & Drug Testing Center',
  address: '',        // e.g. "123 Rizal St., Cagayan de Oro City"
  contact: '',        // e.g. "Tel: (088) 000-0000"
};

// 80mm thermal receipt printer paper. Printable width is narrower than the
// roll itself once margins are applied.
const PAPER_WIDTH = 80;
const MARGIN_X = 4;

const peso = (n) =>
  Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Draws the full receipt onto `doc` starting at the top and returns the final
 * y position reached. Used twice: once on a throwaway tall page to measure
 * the real content height, then again on a page sized exactly to fit —
 * so the printed receipt has no wasted blank paper feed.
 */
const drawReceipt = (doc, tx) => {
  const pageWidth = PAPER_WIDTH;
  const contentWidth = pageWidth - MARGIN_X * 2;
  let y = 8;

  // --- HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(CENTER_INFO.name, pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const taglineLines = doc.splitTextToSize(CENTER_INFO.tagline, contentWidth);
  doc.text(taglineLines, pageWidth / 2, y, { align: 'center' });
  y += (taglineLines.length - 1) * 3.5;

  if (CENTER_INFO.address) {
    y += 3.5;
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(CENTER_INFO.address, contentWidth), pageWidth / 2, y, { align: 'center' });
  }
  if (CENTER_INFO.contact) {
    y += 3.5;
    doc.setFontSize(7);
    doc.text(CENTER_INFO.contact, pageWidth / 2, y, { align: 'center' });
  }

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('BILLING STATEMENT', pageWidth / 2, y, { align: 'center' });

  y += 3;
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  // --- RECEIPT META + PATIENT INFO ---
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  const txDate = tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-PH') : '';
  doc.text(`Transaction No: ${tx.receipt_no || '—'}`, MARGIN_X, y);
  y += 4;
  doc.text(`Date: ${txDate}`, MARGIN_X, y);

  y += 4;
  const patientLines = doc.splitTextToSize(`Patient: ${tx.patient_name || ''}`, contentWidth);
  doc.text(patientLines, MARGIN_X, y);
  y += (patientLines.length - 1) * 3.5;

  const ageSex = [tx.age ? `Age: ${tx.age}` : null, tx.sex ? `Sex: ${tx.sex}` : null]
    .filter(Boolean)
    .join('   ');
  if (ageSex) {
    y += 4;
    doc.text(ageSex, MARGIN_X, y);
  }

  if (tx.discount_type && tx.discount_type !== 'Regular') {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(`${tx.discount_type} — ${Number(tx.discount_percent) || 20}% Discount`, MARGIN_X, y);
    doc.setFont('helvetica', 'normal');
  }

  if (tx.address) {
    y += 4;
    const addrLines = doc.splitTextToSize(`Address: ${tx.address}`, contentWidth);
    doc.text(addrLines, MARGIN_X, y);
    y += (addrLines.length - 1) * 3.5;
  }

  // --- ITEMS ---
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITEM', MARGIN_X, y);
  doc.text('AMOUNT', pageWidth - MARGIN_X, y, { align: 'right' });

  y += 2;
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  y += 4;
  (tx.items || []).forEach((it) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const nameLines = doc.splitTextToSize(it.name, contentWidth);
    doc.text(nameLines, MARGIN_X, y);
    y += nameLines.length * 3.5;

    doc.setFontSize(7);
    doc.text(`${it.qty} x ${peso(it.price)}`, MARGIN_X, y);
    doc.text(peso(it.subtotal), pageWidth - MARGIN_X, y, { align: 'right' });
    y += 4.5;
  });

  y += 0.5;
  doc.setLineWidth(0.2);
  doc.line(MARGIN_X, y, pageWidth - MARGIN_X, y);

  // --- TOTALS ---
  y += 5;
  const line = (label, value, bold = false, size = 7.5) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(label, pageWidth - MARGIN_X - 22, y, { align: 'right' });
    doc.text(peso(value), pageWidth - MARGIN_X, y, { align: 'right' });
    y += 4.5;
  };

  line('Subtotal:', tx.subtotal);
  if (Number(tx.discount) > 0) {
    const isSpecial = tx.discount_type && tx.discount_type !== 'Regular';
    const dLabel = isSpecial
      ? `${tx.discount_type} (${Number(tx.discount_percent) || 20}%):`
      : 'Discount:';
    line(dLabel, tx.discount);
  }
  line('TOTAL:', tx.total, true, 9);
  if (tx.amount_tendered != null && Number(tx.amount_tendered) > 0) {
    line('Tendered:', tx.amount_tendered);
    line('Change:', tx.change);
  }

  // --- FOOTER ---
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Payment: ${tx.payment_method || 'Cash'}`, MARGIN_X, y);
  if (tx.cashier) {
    y += 3.5;
    doc.text(`Cashier: ${tx.cashier}`, MARGIN_X, y);
  }

  y += 10;
  doc.setLineWidth(0.2);
  doc.line(pageWidth / 2 - 18, y, pageWidth / 2 + 18, y);
  y += 3.5;
  doc.setFontSize(7);
  doc.text('Authorized Signature', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(7);
  doc.text(doc.splitTextToSize('Thank you and get well soon!', contentWidth), pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.text(doc.splitTextToSize('FOR REFERENCE ONLY, NOT AN OFFICIAL INVOICE', contentWidth), pageWidth / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  y += 6;
  return y;
};

/**
 * Generate (and open the print dialog for) an official receipt sized for an
 * 80mm thermal receipt printer.
 * @param {object} tx - a saved transaction record from the API.
 */
export const generateReceiptPDF = (tx, { autoPrint = true } = {}) => {
  // Pass 1: draw on a generously tall throwaway page just to measure the
  // actual content height for this receipt (item count varies per sale).
  const measureDoc = new jsPDF('p', 'mm', [PAPER_WIDTH, 1000]);
  const measuredHeight = drawReceipt(measureDoc, tx);

  // jsPDF force-swaps width/height for orientation 'p' whenever width > height
  // (to "enforce" portrait), which would corrupt our fixed 80mm width on a
  // short receipt. Picking the orientation whose swap condition can't fire
  // keeps the format array exactly as given.
  const orientation = measuredHeight >= PAPER_WIDTH ? 'p' : 'l';

  // Pass 2: draw for real on a page sized exactly to the content, so the
  // printer doesn't feed out extra blank roll paper.
  const doc = new jsPDF(orientation, 'mm', [PAPER_WIDTH, measuredHeight]);
  drawReceipt(doc, tx);

  if (autoPrint) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Receipt_${tx.receipt_no || 'DPCY'}.pdf`);
  }
};
