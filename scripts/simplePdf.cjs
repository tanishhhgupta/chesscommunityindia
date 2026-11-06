const fs = require('fs');
const path = require('path');

// Simple pure-JS PDF generator
class SimplePDF {
  constructor() {
    this.pages = [];
    this.currentPage = null;
  }

  addPage() {
    this.currentPage = {
      lines: [],
      ops: []
    };
    this.pages.push(this.currentPage);
    return this;
  }

  // Basic styling & text
  addText(text, x, y, options = {}) {
    if (!this.currentPage) this.addPage();
    const size = options.size || 10;
    const font = options.font || 'F1'; // F1 = Helvetica, F2 = Helvetica-Bold, F3 = Times-Roman, F4 = Times-Bold
    const r = options.color ? options.color[0] : 0.1;
    const g = options.color ? options.color[1] : 0.1;
    const b = options.color ? options.color[2] : 0.1;

    // Sanitize PDF string
    const sanitized = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    
    this.currentPage.ops.push(
      `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`,
      `BT`,
      `/${font} ${size} Tf`,
      `1 0 0 1 ${x} ${y} Tm`,
      `(${sanitized}) Tj`,
      `ET`
    );
    return this;
  }

  addRect(x, y, w, h, fillColor = null, strokeColor = null) {
    if (!this.currentPage) this.addPage();
    let op = '';
    if (fillColor) {
      op += `${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg\n`;
    }
    if (strokeColor) {
      op += `${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG\n`;
    }
    op += `${x} ${y} ${w} ${h} re\n`;
    if (fillColor && strokeColor) {
      op += 'B';
    } else if (fillColor) {
      op += 'f';
    } else if (strokeColor) {
      op += 'S';
    }
    this.currentPage.ops.push(op);
    return this;
  }

  addCurve(startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, options = {}) {
    if (!this.currentPage) this.addPage();
    const color = options.color || [0.78, 0.643, 0.357];
    const width = options.width || 2.5;
    const lineCap = options.roundCap !== false ? '1 J 1 j' : '0 J 0 j';

    const op = [
      `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG`,
      `${width} w`,
      lineCap,
      `${startX.toFixed(2)} ${startY.toFixed(2)} m`,
      `${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${endX.toFixed(2)} ${endY.toFixed(2)} c`,
      'S'
    ].join('\n');

    this.currentPage.ops.push(op);
    return this;
  }

  addLine(startX, startY, endX, endY, options = {}) {
    if (!this.currentPage) this.addPage();
    const color = options.color || [0.78, 0.643, 0.357];
    const width = options.width || 1.5;
    const op = [
      `${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG`,
      `${width} w`,
      '1 J 1 j',
      `${startX.toFixed(2)} ${startY.toFixed(2)} m`,
      `${endX.toFixed(2)} ${endY.toFixed(2)} l`,
      'S'
    ].join('\n');
    this.currentPage.ops.push(op);
    return this;
  }

  build() {
    const objects = [];
    let objCount = 0;
    const addObj = (content) => {
      objCount++;
      objects.push({ id: objCount, content });
      return objCount;
    };

    // 1: Catalog (placeholder, set at end)
    // 2: Pages root
    // Fonts:
    // F1: Helvetica
    // F2: Helvetica-Bold
    // F3: Times-Roman
    // F4: Times-Bold
    const f1Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const f2Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const f3Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
    const f4Id = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');

    const pageObjIds = [];
    const contentObjIds = [];

    // Pre-allocate page objects
    for (let i = 0; i < this.pages.length; i++) {
      pageObjIds.push(++objCount);
      contentObjIds.push(++objCount);
    }

    const pagesRootId = ++objCount;
    const catalogId = ++objCount;

    // Fill Page objects & Content objects
    for (let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];
      const streamContent = page.ops.join('\n');
      const streamLength = Buffer.byteLength(streamContent, 'utf-8');

      // Content object
      objects.push({
        id: contentObjIds[i],
        content: `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`
      });

      // Page object (A4 size: 595.28 x 841.89 pt)
      objects.push({
        id: pageObjIds[i],
        content: `<< /Type /Page /Parent ${pagesRootId} 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentObjIds[i]} 0 R /Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R /F3 ${f3Id} 0 R /F4 ${f4Id} 0 R >> >> >>`
      });
    }

    // Pages root object
    objects.push({
      id: pagesRootId,
      content: `<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${this.pages.length} >>`
    });

    // Catalog object
    objects.push({
      id: catalogId,
      content: `<< /Type /Catalog /Pages ${pagesRootId} 0 R >>`
    });

    // Sort objects by id
    objects.sort((a, b) => a.id - b.id);

    // Assemble PDF with xref table
    let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const xref = [0];

    for (const obj of objects) {
      xref[obj.id] = Buffer.byteLength(output, 'binary');
      output += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(output, 'binary');
    output += `xref\n0 ${objects.length + 1}\n`;
    output += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
      output += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
    }

    output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(output, 'binary');
  }
}

module.exports = { SimplePDF };
