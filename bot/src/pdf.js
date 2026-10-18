import fs from 'node:fs';
import path from 'node:path';
import PDFDocument from 'pdfkit';
import { config } from './config.js';
import { REGIONS, TYPES } from './classify/categories.js';

// Noto Sans CJK có đủ chữ Việt (kể cả dấu chồng) lẫn chữ Hán giản/phồn thể.
const FONT = path.join(config.fontsDir, 'NotoSansCJKsc-Regular.otf');
const FONT_BOLD = path.join(config.fontsDir, 'NotoSansCJKsc-Bold.otf');

const COLOR = { text: '#1f2328', muted: '#656d76', accent: '#8a3b12', rule: '#d0d7de' };

/**
 * Tạo PDF giải thích: loại bùa, nguồn gốc, chức năng, ảnh kèm mô tả, cách phòng tránh.
 * @param images [{ data: Buffer, description, license, artist, source }]
 */
export function renderExplanationPdf({ doc, cls, images }, outPath) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 55, right: 55 },
      info: { Title: doc.title, Subject: 'Tư liệu văn hoá dân gian về bùa ngải', Creator: 'Magic Bot' },
    });
    pdf.registerFont('regular', FONT);
    pdf.registerFont('bold', FONT_BOLD);

    const out = fs.createWriteStream(outPath);
    out.on('finish', resolve);
    out.on('error', reject);
    pdf.on('error', reject);
    pdf.pipe(out);

    const width = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
    const heading = (t) => {
      ensureSpace(pdf, 60);
      pdf.moveDown(0.8).font('bold').fontSize(13).fillColor(COLOR.accent).text(t);
      pdf.moveDown(0.25);
    };
    const para = (t) => pdf.font('regular').fontSize(10.5).fillColor(COLOR.text).text(t, { align: 'justify', lineGap: 2 });

    // Tiêu đề
    pdf.font('bold').fontSize(18).fillColor(COLOR.text).text(doc.title, { lineGap: 2 });
    pdf.moveDown(0.4);
    const meta = [
      ['Khu vực', REGIONS[cls.region].label],
      ['Loại', TYPES[cls.type].label],
      cls.ethnic_groups.length ? ['Dân tộc', cls.ethnic_groups.join(', ')] : null,
      ['Nguồn', doc.url],
    ].filter(Boolean);
    for (const [k, v] of meta) {
      pdf.font('bold').fontSize(9.5).fillColor(COLOR.muted).text(`${k}: `, { continued: true });
      pdf.font('regular').fillColor(COLOR.text).text(v, k === 'Nguồn' ? { link: v, underline: false } : {});
    }
    rule(pdf, width);

    heading('Loại bùa');
    para(cls.ten_bua || TYPES[cls.type].label);
    if (cls.summary_vi) {
      pdf.moveDown(0.3);
      para(cls.summary_vi);
    }

    if (cls.nguon_goc) {
      heading('Nguồn gốc, bối cảnh');
      para(cls.nguon_goc);
    }

    heading('Chức năng (theo tín ngưỡng dân gian)');
    para(cls.chuc_nang);

    // Mở ảnh trước để biết kích thước; ảnh pdfkit không đọc được (webp, gif...) thì bỏ qua.
    const placed = images
      .map((img, i) => {
        try {
          const opened = pdf.openImage(img.data);
          const scale = Math.min(width / opened.width, 300 / opened.height, 1);
          return { img, i, opened, w: opened.width * scale, h: opened.height * scale };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (placed.length) {
      // Giữ tiêu đề đi cùng ảnh đầu tiên, không để tiêu đề mồ côi cuối trang.
      ensureSpace(pdf, placed[0].h + 120);
      heading('Hình ảnh');
      placed.forEach(({ img, i, opened, w, h }, n) => {
        ensureSpace(pdf, h + 70);
        const x = pdf.page.margins.left + (width - w) / 2;
        pdf.image(opened, x, pdf.y, { width: w, height: h });
        pdf.y += h + 6;

        const desc = cls.hinh_anh?.[i] || img.description || '';
        pdf.font('bold').fontSize(9.5).fillColor(COLOR.text).text(`Hình ${n + 1}. `, { continued: true });
        pdf.font('regular').text(desc, { lineGap: 1.5 });
        pdf.font('regular').fontSize(8).fillColor(COLOR.muted)
          .text(`Tác giả: ${img.artist || 'không rõ'} · Giấy phép: ${img.license || 'không rõ'}`, { link: img.source, underline: false });
        pdf.moveDown(0.9);
      });
    }

    heading('Cách phòng tránh');
    for (const tip of cls.cach_phong_tranh) {
      ensureSpace(pdf, 30);
      const x = pdf.page.margins.left;
      const y = pdf.y;
      pdf.font('regular').fontSize(10.5).fillColor(COLOR.accent).text('•', x, y);
      pdf.fillColor(COLOR.text).text(tip, x + 14, y, { width: width - 14, lineGap: 2, paragraphGap: 4 });
    }
    pdf.x = pdf.page.margins.left;

    rule(pdf, width);
    pdf.font('regular').fontSize(8).fillColor(COLOR.muted).text(
      'Tài liệu tổng hợp phục vụ tìm hiểu văn hoá dân gian. Nội dung mô tả niềm tin truyền thống, không phải khẳng định khoa học. ' +
        `Phân loại bằng ${cls.method === 'openai' ? 'OpenAI' : 'từ khoá'}.`,
    );

    pdf.end();
  });
}

function ensureSpace(pdf, needed) {
  if (pdf.y + needed > pdf.page.height - pdf.page.margins.bottom) pdf.addPage();
}

function rule(pdf, width) {
  pdf.moveDown(0.6);
  pdf.moveTo(pdf.page.margins.left, pdf.y).lineTo(pdf.page.margins.left + width, pdf.y).strokeColor(COLOR.rule).lineWidth(0.7).stroke();
  pdf.moveDown(0.6);
}
