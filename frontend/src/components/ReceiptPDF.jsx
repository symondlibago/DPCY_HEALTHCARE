import jsPDF from 'jspdf';

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

const peso = (n) =>
  Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Generate (and open the print dialog for) an official receipt.
 * @param {object} tx - a saved transaction record from the API.
 */
export const generateReceiptPDF = (tx, { autoPrint = true } = {}) => {
  // 148 x 210mm = A5 portrait — a practical printable receipt size.
  const doc = new jsPDF('p', 'mm', 'a5');
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2;
  let y = 16;

  // --- HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(CENTER_INFO.name, pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(CENTER_INFO.tagline, pageWidth / 2, y, { align: 'center' });

  if (CENTER_INFO.address) {
    y += 4;
    doc.setFontSize(8);
    doc.text(CENTER_INFO.address, pageWidth / 2, y, { align: 'center' });
  }
  if (CENTER_INFO.contact) {
    y += 4;
    doc.setFontSize(8);
    doc.text(CENTER_INFO.contact, pageWidth / 2, y, { align: 'center' });
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('OFFICIAL RECEIPT', pageWidth / 2, y, { align: 'center' });

  y += 3;
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageWidth - marginX, y);

  // --- RECEIPT META + PATIENT INFO ---
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const txDate = tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-PH') : '';
  doc.text(`Receipt No: ${tx.receipt_no || '—'}`, marginX, y);
  doc.text(`Date: ${txDate}`, pageWidth - marginX, y, { align: 'right' });

  y += 5;
  doc.text(`Patient: ${tx.patient_name || ''}`, marginX, y);

  y += 5;
  const ageSex = [tx.age ? `Age: ${tx.age}` : null, tx.sex ? `Sex: ${tx.sex}` : null]
    .filter(Boolean)
    .join('     ');
  if (ageSex) doc.text(ageSex, marginX, y);

  if (tx.address) {
    y += 5;
    const addrLines = doc.splitTextToSize(`Address: ${tx.address}`, contentWidth);
    doc.text(addrLines, marginX, y);
    y += (addrLines.length - 1) * 4;
  }

  // --- ITEMS TABLE ---
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SERVICE', marginX, y);
  doc.text('QTY', pageWidth - marginX - 45, y, { align: 'right' });
  doc.text('PRICE', pageWidth - marginX - 22, y, { align: 'right' });
  doc.text('AMOUNT', pageWidth - marginX, y, { align: 'right' });

  y += 2;
  doc.setLineWidth(0.2);
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  (tx.items || []).forEach((it) => {
    const nameLines = doc.splitTextToSize(it.name, contentWidth - 55);
    doc.text(nameLines, marginX, y);
    doc.text(String(it.qty), pageWidth - marginX - 45, y, { align: 'right' });
    doc.text(peso(it.price), pageWidth - marginX - 22, y, { align: 'right' });
    doc.text(peso(it.subtotal), pageWidth - marginX, y, { align: 'right' });
    y += Math.max(nameLines.length * 4, 5);
  });

  y += 1;
  doc.setLineWidth(0.2);
  doc.line(marginX, y, pageWidth - marginX, y);

  // --- TOTALS ---
  const totalsRight = pageWidth - marginX;
  const totalsLabel = pageWidth - marginX - 30;
  y += 6;
  doc.setFontSize(9);

  const line = (label, value, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, totalsLabel, y, { align: 'right' });
    doc.text(peso(value), totalsRight, y, { align: 'right' });
    y += 5;
  };

  line('Subtotal:', tx.subtotal);
  if (Number(tx.discount) > 0) line('Discount:', tx.discount);
  doc.setFontSize(11);
  line('TOTAL:', tx.total, true);
  doc.setFontSize(9);
  if (tx.amount_tendered != null && Number(tx.amount_tendered) > 0) {
    line('Amount Tendered:', tx.amount_tendered);
    line('Change:', tx.change);
  }

  // --- FOOTER ---
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Payment: ${tx.payment_method || 'Cash'}`, marginX, y);
  if (tx.cashier) doc.text(`Cashier: ${tx.cashier}`, pageWidth - marginX, y, { align: 'right' });

  y += 14;
  doc.setLineWidth(0.2);
  doc.line(pageWidth - marginX - 50, y, pageWidth - marginX, y);
  y += 4;
  doc.text('Authorized Signature', pageWidth - marginX - 25, y, { align: 'center' });

  y += 12;
  doc.setFontSize(8);
  doc.text('Thank you and get well soon!', pageWidth / 2, y, { align: 'center' });

  if (autoPrint) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Receipt_${tx.receipt_no || 'DPCY'}.pdf`);
  }
};
