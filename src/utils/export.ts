import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ExportOptions } from '../types';

export const exportToExcel = async (data: any[], options: ExportOptions) => {
  const filteredData = filterDataForExport(data, options);
  const ws = XLSX.utils.json_to_sheet(filteredData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  
  const fileName = `export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportToPDF = async (data: any[], options: ExportOptions) => {
  const filteredData = filterDataForExport(data, options);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Export Report', 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

  const columns = options.includeFields.map(field => ({
    header: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'),
    dataKey: field
  }));

  (doc as any).autoTable({
    startY: 40,
    head: [columns.map(col => col.header)],
    body: filteredData.map(row => 
      columns.map(col => row[col.dataKey])
    ),
  });

  const fileName = `export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
  doc.save(fileName);
};

const filterDataForExport = (data: any[], options: ExportOptions) => {
  let filteredData = [...data];

  // Apply date range filter if specified
  if (options.dateRange) {
    const start = new Date(options.dateRange.start);
    const end = new Date(options.dateRange.end);
    filteredData = filteredData.filter(item => {
      const itemDate = new Date(item.createdAt || item.dateRaised || item.dateReported);
      return itemDate >= start && itemDate <= end;
    });
  }

  // Apply custom filters if specified
  if (options.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      filteredData = filteredData.filter(item => item[key] === value);
    });
  }

  // Only include specified fields
  return filteredData.map(item => {
    const filteredItem: Record<string, any> = {};
    options.includeFields.forEach(field => {
      filteredItem[field] = item[field];
    });
    return filteredItem;
  });
};