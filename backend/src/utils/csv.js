/**
 * Minimal, dependency-free CSV generation.
 *
 * Kept as pure functions so they can be unit-tested without Express or a
 * database. Values are always text; escaping follows RFC 4180.
 */

/**
 * Escape a single CSV cell.
 * Wraps in quotes when the value contains a comma, quote, CR or LF, and
 * doubles any embedded quote characters.
 *
 * @param {unknown} value
 * @returns {string}
 */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/["\r\n,]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV document from a header row and data rows.
 *
 * @param {string[]} headers
 * @param {Array<Array<unknown>>} rows
 * @returns {string} CSV text (without a trailing newline)
 */
function buildCsv(headers, rows) {
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(','));
  }
  return lines.join('\r\n');
}

/**
 * Send a CSV download response.
 * A UTF-8 BOM is prefixed so spreadsheet apps (Excel) detect the encoding and
 * render currency symbols correctly.
 *
 * @param {import('express').Response} res
 * @param {string} filename
 * @param {string} content
 */
function sendCsv(res, filename, content) {
  const safeName = String(filename).replace(/[^a-zA-Z0-9-_.]/g, '_');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(`\uFEFF${content}`);
}

module.exports = { escapeCell, buildCsv, sendCsv };
