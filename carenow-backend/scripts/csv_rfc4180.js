/** RFC 4180 CSV parser — hỗ trợ trường có dấu ngoặc kép và xuống dòng trong cell. */

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;
  const len = content.length;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === '' && rows.length === 0) return;
    rows.push(row);
    row = [];
  };

  while (i < len) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < len && content[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += c;
        i += 1;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      pushField();
      i += 1;
      continue;
    }
    if (c === '\n') {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    if (c === '\r') {
      if (i + 1 < len && content[i + 1] === '\n') i += 1;
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  pushField();
  if (row.length && !(row.length === 1 && row[0] === '')) pushRow();
  return rows;
}

function stripBom(s) {
  if (s && s.charCodeAt(0) === 0xfeff) return s.slice(1);
  return s;
}

module.exports = { parseCsv, stripBom };
