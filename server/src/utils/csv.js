// RFC 4180 CSV with protection against spreadsheet formula injection.
const cell = (value) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers, rows) =>
  "﻿" + [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
