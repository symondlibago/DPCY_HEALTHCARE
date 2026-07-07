import * as XLSX from 'xlsx';

const num = (n) => Number(n || 0);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PH') : '');

/**
 * Export a single transaction as an .xlsx record (patient info + line items + totals).
 */
export function downloadTransactionExcel(tx) {
  const aoa = [
    ['DPCY Healthcare — Transaction Record'],
    [],
    ['Receipt No', tx.receipt_no || ''],
    ['Date', fmtDate(tx.transaction_date)],
    ['Patient', tx.patient_name || ''],
    ['Age', tx.age ?? ''],
    ['Sex', tx.sex || ''],
    ['Address', tx.address || ''],
    ['Payment', tx.payment_method || ''],
    ['Cashier', tx.cashier || ''],
    [],
    ['Service', 'Qty', 'Unit Price', 'Amount'],
    ...(tx.items || []).map((i) => [i.name, num(i.qty), num(i.price), num(i.subtotal ?? i.price * i.qty)]),
    [],
    ['', '', 'Subtotal', num(tx.subtotal)],
    ['', '', 'Discount', num(tx.discount)],
    ['', '', 'Total', num(tx.total)],
    ['', '', 'Tendered', num(tx.amount_tendered)],
    ['', '', 'Change', num(tx.change)],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Receipt');
  XLSX.writeFile(wb, `Receipt_${tx.receipt_no || 'DPCY'}.xlsx`);
}

/**
 * Export a list of transactions as a records sheet (one row per transaction).
 */
export function downloadTransactionsExcel(list, filename = 'Transactions') {
  const header = ['Receipt No', 'Date', 'Patient', 'Age', 'Sex', 'Services', 'Subtotal', 'Discount', 'Total', 'Payment', 'Cashier'];
  const body = (list || []).map((t) => [
    t.receipt_no || '',
    fmtDate(t.transaction_date),
    t.patient_name || '',
    t.age ?? '',
    t.sex || '',
    (t.items || []).map((i) => `${i.name} x${i.qty}`).join(', '),
    num(t.subtotal),
    num(t.discount),
    num(t.total),
    t.payment_method || '',
    t.cashier || '',
  ]);
  const grand = (list || []).reduce((s, t) => s + num(t.total), 0);
  const aoa = [header, ...body, [], ['', '', '', '', '', 'TOTAL', '', '', grand]];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 22 }, { wch: 6 }, { wch: 6 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export a sales-report breakdown (daily/weekly/monthly/yearly).
 */
export function downloadSalesReportExcel(rows, { title = 'Sales', filename = 'Sales_Report' } = {}) {
  const header = ['Period', 'Transactions', 'Total Sales'];
  const body = (rows || []).map((r) => [r.label, num(r.count), num(r.total)]);
  const grand = (rows || []).reduce((s, r) => s + num(r.total), 0);
  const aoa = [[`DPCY Healthcare — ${title} Sales Report`], [], header, ...body, [], ['TOTAL', '', grand]];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
