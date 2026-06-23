import fontkit from "@pdf-lib/fontkit";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFImage, type PDFPage, type PDFFont } from "pdf-lib";
import { prepareReportExport, type PreparedReportExport } from "./reportExportTypes.ts";
import { replaceForbiddenUserFacingTerms } from "../i18n/userFacingSanitizer.ts";
import { formatRiskLevel, riskMatrixHeaderLabels } from "../risk/riskScoring.ts";
import { cleanInlineSourcePlaceholders } from "../report/sourceCitationFormatter.ts";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const BRAND = rgb(0.88, 0.08, 0.27);
const TEXT = rgb(0.07, 0.07, 0.07);
const MUTED = rgb(0.41, 0.45, 0.5);
const LIGHT = rgb(0.94, 0.95, 0.97);

const logoPaths = [
  { d: "M7 8h38l-8 8H7V8Z", color: BRAND },
  { d: "M7 24h22l-8 8H7v-8Z", color: BRAND },
  { d: "M29 8h20L29 32H9l20-24Z", color: BRAND },
  { d: "M15 16h30l-7.9 8H15v-8Z", color: BRAND },
  { d: "M58 28V12h10.5v3.2h-6.8v3.6h6v3.2h-6V28H58Z", color: TEXT },
  { d: "M72 28V12h3.8v16H72Z", color: TEXT },
  { d: "M80 28V12h3.6l7.5 9.7V12h3.7v16h-3.5l-7.6-9.8V28H80Z", color: TEXT },
  { d: "M99.1 28V12h3.8v6.7l6.1-6.7h4.7l-6.6 7.1 7 8.9h-4.8l-4.8-6.2-1.6 1.7V28h-3.8Z", color: TEXT },
  { d: "M122.5 28.3c-4.7 0-8.1-3.5-8.1-8.2 0-4.8 3.4-8.3 8.1-8.3 4.8 0 8.2 3.5 8.2 8.3 0 4.7-3.4 8.2-8.2 8.2Zm0-3.5c2.5 0 4.2-2 4.2-4.7 0-2.8-1.7-4.8-4.2-4.8s-4.1 2-4.1 4.8c0 2.7 1.6 4.7 4.1 4.7Z", color: TEXT }
];

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  logoImage?: PDFImage;
  textMode: "unicode" | "winansi";
  locale: PreparedReportExport["locale"];
  y: number;
  pageIndex: number;
};

async function firstReadablePath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

async function embedLogoImage(doc: PDFDocument) {
  const logoCandidates = [
    path.join(process.cwd(), "public", "finko-logo.png"),
    path.join(process.cwd(), "public", "logo.png")
  ];
  const logoPath = await firstReadablePath(logoCandidates);
  if (!logoPath) return undefined;
  try {
    return await doc.embedPng(await readFile(logoPath));
  } catch {
    return undefined;
  }
}

async function embedUnicodeFonts(doc: PDFDocument) {
  const projectFontDir = path.join(process.cwd(), "public", "fonts");

  // Use only full Unicode TTF/OTF fonts. Do not use @fontsource WOFF unicode-range subsets here:
  // pdf-lib embeds a single font, so subset WOFF files can render digits, punctuation, spaces,
  // bullets or some Cyrillic glyphs as boxes in the exported PDF.
  const fontPairs = [
    {
      regular: path.join(projectFontDir, "NotoSans-Regular.ttf"),
      bold: path.join(projectFontDir, "NotoSans-Bold.ttf")
    },
    {
      regular: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      bold: "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    },
    {
      regular: "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
      bold: "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"
    },
    {
      regular: "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
      bold: "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
    },
    {
      regular: "C:\\Windows\\Fonts\\arial.ttf",
      bold: "C:\\Windows\\Fonts\\arialbd.ttf"
    },
    {
      regular: "C:\\Windows\\Fonts\\segoeui.ttf",
      bold: "C:\\Windows\\Fonts\\segoeuib.ttf"
    },
    {
      regular: "/System/Library/Fonts/Supplemental/Arial.ttf",
      bold: "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    },
    {
      regular: "/Library/Fonts/Arial Unicode.ttf",
      bold: "/Library/Fonts/Arial Unicode.ttf"
    }
  ];

  for (const pair of fontPairs) {
    const regularPath = await firstReadablePath([pair.regular]);
    const boldPath = await firstReadablePath([pair.bold]);
    if (!regularPath || !boldPath) continue;
    try {
      const font = await doc.embedFont(await readFile(regularPath), { subset: false });
      const boldFont = await doc.embedFont(await readFile(boldPath), { subset: false });
      return { font, boldFont, textMode: "unicode" as const };
    } catch {
      // Try the next candidate pair; some platforms expose fonts in formats fontkit cannot embed.
    }
  }

  try {
    const fetchFont = async (urls: string[]) => {
      let lastError: unknown;
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Font download failed: ${response.status}`);
          const buffer = Buffer.from(await response.arrayBuffer());
          if (buffer.byteLength < 100000) throw new Error("Downloaded font file is unexpectedly small");
          return buffer;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError instanceof Error ? lastError : new Error("Font download failed");
    };
    const [regularBuffer, boldBuffer] = await Promise.all([
      fetchFont([
        "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
        "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf"
      ]),
      fetchFont([
        "https://raw.githubusercontent.com/notofonts/noto-fonts/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
        "https://github.com/notofonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf"
      ])
    ]);
    const font = await doc.embedFont(regularBuffer, { subset: false });
    const boldFont = await doc.embedFont(boldBuffer, { subset: false });
    return { font, boldFont, textMode: "unicode" as const };
  } catch {
    // Network font loading failed; do not create a PDF with transliterated Cyrillic.
  }

  throw new Error("Ошибка экспорта PDF: Unicode-шрифт не найден. PDF не создан.");
}

const CYRILLIC_LATIN_MAP: Record<string, string> = {
  А: "A", а: "a", Б: "B", б: "b", В: "V", в: "v", Г: "G", г: "g", Д: "D", д: "d",
  Е: "E", е: "e", Ё: "Yo", ё: "yo", Ж: "Zh", ж: "zh", З: "Z", з: "z", И: "I", и: "i",
  Й: "Y", й: "y", К: "K", к: "k", Л: "L", л: "l", М: "M", м: "m", Н: "N", н: "n",
  О: "O", о: "o", П: "P", п: "p", Р: "R", р: "r", С: "S", с: "s", Т: "T", т: "t",
  У: "U", у: "u", Ф: "F", ф: "f", Х: "Kh", х: "kh", Ц: "Ts", ц: "ts", Ч: "Ch", ч: "ch",
  Ш: "Sh", ш: "sh", Щ: "Sch", щ: "sch", Ъ: "", ъ: "", Ы: "Y", ы: "y", Ь: "", ь: "",
  Э: "E", э: "e", Ю: "Yu", ю: "yu", Я: "Ya", я: "ya",
  Ў: "O'", ў: "o'", Ғ: "G'", ғ: "g'", Қ: "Q", қ: "q", Ҳ: "H", ҳ: "h",
  І: "I", і: "i", Ї: "Yi", ї: "yi", Є: "Ye", є: "ye"
};

function toWinAnsiText(value: string) {
  return value
    .replace(/[А-яЁёЎўҒғҚқҲҳІіЇїЄє]/g, (char) => CYRILLIC_LATIN_MAP[char] ?? "")
    .replace(/[•·]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/₽/g, "RUB")
    .replace(/₸/g, "KZT")
    .replace(/₩/g, "KRW")
    .replace(/₹/g, "INR")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

function cleanPdfText(value: string) {
  return String(value ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/[•·]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/"?(value|sourceUrl|year|citation|unit|sourceId|matchQuality)"?\s*[—:-][^\n]*/gi, "")
    .replace(/\{[\s\S]{0,600}?\}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function pdfText(context: PdfContext, value: string) {
  const cleaned = replaceForbiddenUserFacingTerms(cleanPdfText(value), context.locale);
  return context.textMode === "unicode" ? cleaned : toWinAnsiText(cleaned);
}

function pdfReferenceText(context: PdfContext, value: string) {
  const cleaned = cleanPdfText(value);
  return context.textMode === "unicode" ? cleaned : toWinAnsiText(cleaned);
}

function wrapTextForContext(context: PdfContext, text: string, font: PDFFont, size: number, maxWidth: number) {
  return wrapText(pdfText(context, text), font, size, maxWidth);
}

function wrapReferenceTextForContext(context: PdfContext, text: string, font: PDFFont, size: number, maxWidth: number) {
  return wrapText(pdfReferenceText(context, text), font, size, maxWidth);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const normalized = text.replace(/\r/g, "");
  const paragraphs = normalized.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      current = word;
    }
    if (current) lines.push(current);
  }

  return lines;
}

function addPage(context: PdfContext) {
  context.page = context.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  context.y = PAGE_HEIGHT - MARGIN;
  context.pageIndex += 1;
}

function ensureSpace(context: PdfContext, height: number) {
  if (context.y - height < MARGIN) {
    addPage(context);
  }
}

function drawTextBlock(context: PdfContext, text: string, options?: { size?: number; color?: ReturnType<typeof rgb>; x?: number; lineGap?: number; font?: PDFFont }) {
  const size = options?.size ?? 10;
  const x = options?.x ?? MARGIN;
  const lineGap = options?.lineGap ?? 4;
  const font = options?.font ?? context.font;
  const lines = wrapTextForContext(context, text, font, size, PAGE_WIDTH - x - MARGIN);
  const lineHeight = size + lineGap;

  for (const line of lines) {
    ensureSpace(context, lineHeight + 2);
    if (line) {
      context.page.drawText(line, {
        x,
        y: context.y - size,
        size,
        font,
        color: options?.color ?? TEXT
      });
    }
    context.y -= lineHeight;
  }
}

function drawBulletList(context: PdfContext, items: string[]) {
  for (const item of items) {
    drawTextBlock(context, `• ${item}`, { size: 10 });
  }
}

function drawReferenceList(context: PdfContext, items: string[]) {
  const size = 10;
  const lineGap = 4;
  const lineHeight = size + lineGap;
  for (const item of items) {
    const lines = wrapReferenceTextForContext(context, `• ${item}`, context.font, size, PAGE_WIDTH - MARGIN * 2);
    ensureSpace(context, lines.length * lineHeight);
    for (const line of lines) {
      context.page.drawText(line, {
        x: MARGIN,
        y: context.y - size,
        size,
        font: context.font,
        color: TEXT
      });
      context.y -= lineHeight;
    }
  }
}

function drawSectionTitle(context: PdfContext, title: string) {
  ensureSpace(context, 28);
  context.page.drawText(pdfText(context, title), {
    x: MARGIN,
    y: context.y - 18,
    size: 15,
    font: context.boldFont,
    color: TEXT
  });
  context.y -= 26;
  context.page.drawLine({
    start: { x: MARGIN, y: context.y },
    end: { x: PAGE_WIDTH - MARGIN, y: context.y },
    thickness: 1,
    color: LIGHT
  });
  context.y -= 14;
}

function drawKeyValueRows(context: PdfContext, rows: Array<{ label: string; value: string }>) {
  for (const row of rows) {
    const labelWidth = 150;
    const valueWidth = PAGE_WIDTH - MARGIN * 2 - labelWidth - 12;
    const valueLines = wrapTextForContext(context, row.value, context.font, 10, valueWidth);
    const height = Math.max(24, valueLines.length * 14 + 10);
    ensureSpace(context, height + 6);

    context.page.drawRectangle({
      x: MARGIN,
      y: context.y - height,
      width: PAGE_WIDTH - MARGIN * 2,
      height,
      color: rgb(1, 1, 1),
      borderColor: LIGHT,
      borderWidth: 1
    });
    context.page.drawRectangle({
      x: MARGIN,
      y: context.y - height,
      width: labelWidth,
      height,
      color: LIGHT
    });
    context.page.drawText(pdfText(context, row.label), {
      x: MARGIN + 8,
      y: context.y - 16,
      size: 10,
      font: context.boldFont,
      color: TEXT
    });
    let lineY = context.y - 16;
    for (const line of valueLines) {
      context.page.drawText(line, {
        x: MARGIN + labelWidth + 10,
        y: lineY,
        size: 10,
        font: context.font,
        color: TEXT
      });
      lineY -= 14;
    }
    context.y -= height + 6;
  }
}

function drawSimpleTable(context: PdfContext, headers: string[], rows: string[][], columnWidths: number[]) {
  const startX = MARGIN;
  const rowHeight = 18;
  ensureSpace(context, rowHeight + 6);

  let x = startX;
  for (let i = 0; i < headers.length; i += 1) {
    context.page.drawRectangle({
      x,
      y: context.y - rowHeight,
      width: columnWidths[i],
      height: rowHeight,
      color: BRAND
    });
    context.page.drawText(pdfText(context, headers[i]), {
      x: x + 4,
      y: context.y - 12,
      size: 8,
      font: context.boldFont,
      color: rgb(1, 1, 1)
    });
    x += columnWidths[i];
  }
  context.y -= rowHeight;

  for (const row of rows) {
    const wrapped = row.map((cell, index) => wrapTextForContext(context, cell, context.font, 8, columnWidths[index] - 8));
    const height = Math.max(...wrapped.map((lines) => Math.max(lines.length, 1))) * 11 + 8;
    ensureSpace(context, height + 2);
    x = startX;
    for (let i = 0; i < row.length; i += 1) {
      context.page.drawRectangle({
        x,
        y: context.y - height,
        width: columnWidths[i],
        height,
        color: rgb(1, 1, 1),
        borderColor: LIGHT,
        borderWidth: 1
      });
      let lineY = context.y - 11;
      for (const line of wrapped[i]) {
        context.page.drawText(line, {
          x: x + 4,
          y: lineY,
          size: 8,
          font: context.font,
          color: TEXT
        });
        lineY -= 11;
      }
      x += columnWidths[i];
    }
    context.y -= height;
  }
  context.y -= 8;
}


function numberFromCurrency(value: string) {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function drawBarChart(context: PdfContext, title: string, rows: Array<{ item: string; amount: string }>) {
  const items = rows.filter((row) => numberFromCurrency(row.amount) > 0).slice(0, 7);
  if (!items.length) return;
  ensureSpace(context, 48 + items.length * 18);
  context.page.drawText(pdfText(context, title), { x: MARGIN, y: context.y - 12, size: 10, font: context.boldFont, color: TEXT });
  context.y -= 22;
  const max = Math.max(...items.map((row) => numberFromCurrency(row.amount)), 1);
  for (const row of items) {
    const value = numberFromCurrency(row.amount);
    const label = wrapTextForContext(context, row.item, context.font, 7, 120)[0] ?? pdfText(context, row.item);
    context.page.drawText(label, { x: MARGIN, y: context.y - 10, size: 7, font: context.font, color: TEXT });
    context.page.drawRectangle({ x: MARGIN + 130, y: context.y - 12, width: 210, height: 8, color: LIGHT });
    context.page.drawRectangle({ x: MARGIN + 130, y: context.y - 12, width: Math.max(2, 210 * value / max), height: 8, color: BRAND });
    context.page.drawText(pdfText(context, row.amount), { x: MARGIN + 350, y: context.y - 10, size: 7, font: context.font, color: MUTED });
    context.y -= 17;
  }
  context.y -= 10;
}

function drawLogo(context: PdfContext) {
  if (context.logoImage) {
    const height = 42;
    const width = height * (context.logoImage.width / context.logoImage.height);
    context.page.drawImage(context.logoImage, {
      x: MARGIN,
      y: context.y - height,
      width,
      height
    });
    return;
  }
  for (const path of logoPaths) {
    context.page.drawSvgPath(path.d, {
      x: MARGIN,
      y: context.y - 34,
      scale: 1,
      color: path.color
    });
  }
}

function drawFooter(page: PDFPage, font: PDFFont, pageNumber: number) {
  const footerText = `FINKO Business Advisor - ${pageNumber}`;
  page.drawText(footerText, {
    x: MARGIN,
    y: 18,
    size: 9,
    font,
    color: MUTED
  });
}

function cleanAiNarrativeForPdf(value: string, locale: PreparedReportExport["locale"]) {
  const sourceHeading = locale === "ru"
    ? /(?:^|\n)\s*(?:#{1,6}\s*)?(?:Источники|References|AI data sources|Источники данных AI|Manbalar|AI ma'lumot manbalari)\b[\s\S]*$/i
    : locale === "uz"
      ? /(?:^|\n)\s*(?:#{1,6}\s*)?(?:Manbalar|References|Sources|AI data sources|AI ma'lumot manbalari)\b[\s\S]*$/i
      : /(?:^|\n)\s*(?:#{1,6}\s*)?(?:References|Sources|AI data sources)\b[\s\S]*$/i;
  const glossaryHeading = /(?:^|\n)\s*(?:#{1,6}\s*)?(?:Glossary|Глоссарий|Lug'at)\b[\s\S]*$/i;
  const disclaimerHeading = /(?:^|\n)\s*(?:#{1,6}\s*)?(?:Disclaimer|Ограничение ответственности|Ogohlantirish)\b[\s\S]*$/i;
  return cleanInlineSourcePlaceholders(value, locale)
    .replace(sourceHeading, "")
    .replace(glossaryHeading, "")
    .replace(disclaimerHeading, "")
    .replace(/([^\n])\s*(#{1,6}\s*\d+[.)]?\s+)/g, "$1\n\n$2")
    .replace(/\bReferences\b/g, locale === "ru" ? "Источники" : locale === "uz" ? "Manbalar" : "Sources")
    .replace(/\bObjects per month\b/gi, locale === "ru" ? "объектов/проектов в месяц" : locale === "uz" ? "oyiga obyekt/loyihalar" : "projects per month")
    .replace(/\bEquipment margin\b/gi, locale === "ru" ? "маржа на оборудовании" : locale === "uz" ? "uskuna marjasi" : "equipment margin")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/требуется\s+проверка/gi, locale === "ru" ? "данные нужно подтвердить" : locale === "uz" ? "ma'lumotlarni tasdiqlash kerak" : "data must be verified")
    .replace(/Требуется\s+ручная\s+проверка/gi, locale === "ru" ? "данные нужно подтвердить" : locale === "uz" ? "ma'lumotlarni tasdiqlash kerak" : "data must be verified")
    .replace(/(?:Требует\s+уточнения\s*){2,}/gi, locale === "ru" ? "данные требуют подтверждения" : locale === "uz" ? "ma'lumotlarni tasdiqlash kerak" : "data needs confirmation")
    .replace(/Staff\s+и\s+quality/gi, locale === "ru" ? "персонал и контроль качества" : locale === "uz" ? "xodimlar va sifat nazorati" : "staff and quality")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type AiNarrativeSegment = { text: string; heading: boolean };

function aiNarrativeSegments(text: string): AiNarrativeSegment[] {
  return text
    .replace(/\r/g, "")
    .replace(/([^\n])\s*(#{1,6}\s*\d+[.)]?\s+)/g, "$1\n\n$2")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const headingMatch = part.match(/^#{1,6}\s*(.+)$/);
      return headingMatch
        ? { text: headingMatch[1].trim(), heading: true }
        : { text: part.replace(/^#{1,6}\s*/, "").trim(), heading: false };
    });
}

function drawAiNarrative(context: PdfContext, text: string) {
  for (const segment of aiNarrativeSegments(text)) {
    if (segment.heading) {
      ensureSpace(context, 28);
      drawTextBlock(context, segment.text, { size: 11, lineGap: 3, font: context.boldFont });
      context.y -= 2;
      continue;
    }
    drawTextBlock(context, segment.text, { size: 10, lineGap: 4 });
    context.y -= 5;
  }
}

function drawCover(context: PdfContext, data: PreparedReportExport) {
  drawLogo(context);
  context.y -= 64;
  context.page.drawText(pdfText(context, data.title), {
    x: MARGIN,
    y: context.y - 24,
    size: 22,
    font: context.boldFont,
    color: TEXT
  });
  context.y -= 44;
  drawKeyValueRows(context, data.cover);
  drawSectionTitle(context, data.locale === "ru" ? "Краткое резюме" : data.locale === "uz" ? "Qisqacha xulosa" : "Executive summary");
  drawBulletList(context, data.executiveSummary);
  const aiNarrative = data.aiReport?.fullNarrative ? cleanAiNarrativeForPdf(data.aiReport.fullNarrative, data.locale) : "";
  if (aiNarrative) {
    drawSectionTitle(context, data.locale === "ru" ? "ИИ Анализ и рекомендации" : data.locale === "uz" ? "AI tahlili va tavsiyalar" : "AI Analysis and Recommendations");
    drawAiNarrative(context, aiNarrative);
  }
}

function drawBody(context: PdfContext, data: PreparedReportExport) {
  const t = data.locale;
  drawSectionTitle(context, t === "ru" ? "Идентификация проекта" : t === "uz" ? "Loyiha identifikatsiyasi" : "Project identity");
  drawKeyValueRows(context, data.summary);

  drawSectionTitle(context, t === "ru" ? "Бизнес-профиль и модель" : t === "uz" ? "Biznes profili va modeli" : "Business profile and model");
  drawSimpleTable(
    context,
    [t === "ru" ? "Показатель" : t === "uz" ? "Ko'rsatkich" : "Indicator", t === "ru" ? "Значение" : t === "uz" ? "Qiymat" : "Value", t === "ru" ? "Комментарий" : t === "uz" ? "Izoh" : "Comment"],
    data.businessProfileRows.map((row) => [row.item, row.amount, row.comment]),
    [150, 145, 220]
  );

  drawSectionTitle(context, t === "ru" ? "Финансовая модель" : t === "uz" ? "Moliyaviy model" : "Financial model");
  drawSimpleTable(
    context,
    [t === "ru" ? "Показатель" : t === "uz" ? "Ko'rsatkich" : "Indicator", t === "ru" ? "Значение" : t === "uz" ? "Qiymat" : "Value", t === "ru" ? "Комментарий" : t === "uz" ? "Izoh" : "Comment"],
    data.financialRows.map((row) => [row.indicator, row.value, row.comment]),
    [160, 130, 225]
  );
  if (data.financingRecommendation) {
    drawTextBlock(context, data.financingRecommendation, { size: 10 });
  }

  drawSectionTitle(context, t === "ru" ? "Чувствительность" : t === "uz" ? "Sezgirlik" : "Sensitivity");
  drawSimpleTable(context, [t === "ru" ? "Сценарий" : t === "uz" ? "Ssenariy" : "Scenario", t === "ru" ? "Значение" : t === "uz" ? "Qiymat" : "Value", t === "ru" ? "Комментарий" : t === "uz" ? "Izoh" : "Comment"], data.sensitivityRows.map((row) => [row.item, row.amount, row.comment]), [170, 135, 210]);

  drawSectionTitle(context, t === "ru" ? "CapEx: стартовые инвестиции" : t === "uz" ? "CapEx: boshlang'ich investitsiyalar" : "CapEx");
  drawBarChart(context, t === "ru" ? "Структура инвестиций" : t === "uz" ? "Investitsiya tuzilmasi" : "Investment structure", data.capexRows);
  drawSimpleTable(context, [t === "ru" ? "Статья" : t === "uz" ? "Modda" : "Item", t === "ru" ? "Сумма" : t === "uz" ? "Summa" : "Amount", t === "ru" ? "Источник" : t === "uz" ? "Manba" : "Source"], data.capexRows.map((row) => [row.item, row.amount, row.source]), [210, 135, 170]);

  drawSectionTitle(context, t === "ru" ? "OpEx: ежемесячные расходы" : t === "uz" ? "OpEx: oylik xarajatlar" : "OpEx");
  drawBarChart(context, t === "ru" ? "Структура расходов" : t === "uz" ? "Xarajatlar tuzilmasi" : "Expense structure", data.opexRows);
  drawSimpleTable(context, [t === "ru" ? "Статья" : t === "uz" ? "Modda" : "Item", t === "ru" ? "Сумма" : t === "uz" ? "Summa" : "Amount", t === "ru" ? "Источник" : t === "uz" ? "Manba" : "Source"], data.opexRows.map((row) => [row.item, row.amount, row.source]), [210, 135, 170]);

  drawSectionTitle(context, t === "ru" ? "Оборотный капитал" : t === "uz" ? "Aylanma kapital" : "Working capital");
  drawSimpleTable(context, [t === "ru" ? "Элемент" : t === "uz" ? "Element" : "Element", t === "ru" ? "Сумма" : t === "uz" ? "Summa" : "Amount", t === "ru" ? "Комментарий" : t === "uz" ? "Izoh" : "Comment"], data.workingCapitalRows.map((row) => [row.item, row.amount, row.comment]), [185, 130, 200]);

  drawSectionTitle(context, t === "ru" ? "Финансирование" : t === "uz" ? "Moliyalashtirish" : "Financing");
  drawBarChart(context, t === "ru" ? "Структура финансирования" : t === "uz" ? "Moliyalashtirish tuzilmasi" : "Financing structure", data.financingRows);
  drawSimpleTable(context, [t === "ru" ? "Элемент" : t === "uz" ? "Element" : "Element", t === "ru" ? "Сумма" : t === "uz" ? "Summa" : "Amount", t === "ru" ? "Комментарий" : t === "uz" ? "Izoh" : "Comment"], data.financingRows.map((row) => [row.item, row.amount, row.comment]), [185, 130, 200]);

  drawSectionTitle(context, t === "ru" ? "Помещение и инфраструктура" : t === "uz" ? "Joy va infratuzilma" : "Premises and infrastructure");
  drawSimpleTable(context, [t === "ru" ? "Элемент" : t === "uz" ? "Element" : "Element", t === "ru" ? "Значение" : t === "uz" ? "Qiymat" : "Value", t === "ru" ? "Комментарий" : t === "uz" ? "Izoh" : "Comment"], data.premisesRows.map((row) => [row.item, row.amount, row.comment]), [185, 130, 200]);

  drawSectionTitle(context, t === "ru" ? "Готовность к финансированию" : t === "uz" ? "Moliyalashtirishga tayyorlik" : "Financing readiness");
  drawSimpleTable(context, [t === "ru" ? "Элемент" : t === "uz" ? "Element" : "Element", t === "ru" ? "Значение" : t === "uz" ? "Qiymat" : "Value", t === "ru" ? "Комментарий" : t === "uz" ? "Izoh" : "Comment"], data.collateralRows.map((row) => [row.item, row.amount, row.comment]), [185, 130, 200]);

  if (data.warnings.length) {
    drawSectionTitle(context, t === "ru" ? "Предупреждения" : t === "uz" ? "Ogohlantirishlar" : "Warnings");
    drawSimpleTable(context, [t === "ru" ? "Тип предупреждения" : t === "uz" ? "Ogohlantirish turi" : "Warning type", t === "ru" ? "Предупреждение" : t === "uz" ? "Ogohlantirish" : "Warning", t === "ru" ? "Значения" : t === "uz" ? "Qiymatlar" : "Values"], data.warnings.map((row) => [row.title, row.message, row.values]), [120, 260, 135]);
  }

  drawSectionTitle(context, t === "ru" ? "Матрица рисков" : t === "uz" ? "Risk matritsasi" : "Risk matrix");
  drawSimpleTable(
    context,
    riskMatrixHeaderLabels(t),
    data.report.riskMatrix.map((row) => [row.title, String(row.probability), String(row.impact), String(row.score), formatRiskLevel(row.level, t, row.score)]),
    [190, 70, 55, 45, 70]
  );

  drawSectionTitle(context, t === "ru" ? "Подробный реестр рисков" : t === "uz" ? "Batafsil risk reyestri" : "Detailed risk register");
  drawSimpleTable(
    context,
    [t === "ru" ? "Риск" : t === "uz" ? "Risk" : "Risk", t === "ru" ? "Причина" : t === "uz" ? "Sabab" : "Reason", t === "ru" ? "Митигация" : t === "uz" ? "Kamaytirish chorasi" : "Mitigation"],
    data.report.riskMatrix.map((row) => [row.title, row.reason, row.mitigation]),
    [145, 185, 185]
  );

  drawSectionTitle(context, t === "ru" ? "Рыночные данные и статистика" : t === "uz" ? "Bozor dalillari va statistika" : "Market evidence and statistics");
  drawSimpleTable(context, [t === "ru" ? "Показатель" : t === "uz" ? "Ko'rsatkich" : "Indicator", t === "ru" ? "Значение" : t === "uz" ? "Qiymat" : "Value", t === "ru" ? "Как использовать" : t === "uz" ? "Qanday ishlatish" : "How to use"], data.marketEvidenceRows.map((row) => [row.item, row.amount, [row.source, row.comment].filter(Boolean).join(". ")]), [170, 120, 225]);

  drawSectionTitle(context, t === "ru" ? "Документы и разрешения" : t === "uz" ? "Hujjatlar va ruxsatlar" : "Documents and permits");
  drawSimpleTable(
    context,
    [t === "ru" ? "Документ / действие" : t === "uz" ? "Hujjat / harakat" : "Document / action", t === "ru" ? "Зачем нужен" : t === "uz" ? "Nima uchun kerak" : "Why needed", t === "ru" ? "Где проверить" : t === "uz" ? "Qayerda tekshirish" : "Where to check", t === "ru" ? "Что уточнить" : t === "uz" ? "Nimani aniqlash" : "What to verify"],
    data.documentRows.map((row) => [row.item, row.amount, row.source, row.comment]),
    [125, 135, 125, 130]
  );

  drawSectionTitle(context, t === "ru" ? "План действий" : t === "uz" ? "Harakat rejasi" : "Action plan");
  drawBulletList(context, data.recommendations.map((row) => row.recommendation));

  if (data.detailedConclusion.length) {
    drawSectionTitle(context, t === "ru" ? "Подробное заключение" : t === "uz" ? "Batafsil xulosa" : "Detailed conclusion");
    drawBulletList(context, data.detailedConclusion);
  }

  drawSectionTitle(context, t === "ru" ? "Список источников" : t === "uz" ? "Manbalar" : "References");
  drawReferenceList(context, data.sources.map((row) => row.notes || row.sourceName));

  drawSectionTitle(context, t === "ru" ? "Допущения и пробелы в данных" : t === "uz" ? "Farazlar va ma'lumot bo'shliqlari" : "Assumptions and data gaps");
  drawBulletList(context, data.assumptionRows.map((row) => `${row.item}: ${row.amount}`));

  drawSectionTitle(context, t === "ru" ? "Глоссарий финансовых терминов" : t === "uz" ? "Moliyaviy atamalar glossariysi" : "Financial Terms Glossary");
  drawSimpleTable(
    context,
    [t === "ru" ? "Термин" : t === "uz" ? "Atama" : "Term", t === "ru" ? "Расшифровка" : t === "uz" ? "Izoh" : "Definition"],
    data.glossaryRows.map((row) => [row.term, row.definition]),
    [130, 385]
  );

  ensureSpace(context, 90);
  drawSectionTitle(context, t === "ru" ? "Ограничение ответственности" : t === "uz" ? "Ogohlantirish" : "Disclaimer");
  drawTextBlock(context, data.disclaimer, { size: 10, color: MUTED });
}

export async function buildPdfReportBuffer(project: Record<string, unknown>, localeOverride?: unknown) {
  const data = prepareReportExport(project, localeOverride);
  return buildPdfReportFromData(data);
}

export async function buildPdfReportFromData(data: PreparedReportExport) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(data.title);
  doc.setAuthor("FINKO Business Advisor");
  doc.setSubject(`Project report: ${data.title}`);
  doc.setKeywords(["FINKO", data.title, data.locale === "ru" ? "финансовая модель" : data.locale === "uz" ? "moliyaviy model" : "financial model", data.locale === "ru" ? "риски" : data.locale === "uz" ? "risklar" : "risks", data.locale === "ru" ? "источники" : data.locale === "uz" ? "manbalar" : "sources"]);
  doc.setProducer("Codex");
  doc.setLanguage(data.locale);

  const { font, boldFont, textMode } = await embedUnicodeFonts(doc);
  const logoImage = await embedLogoImage(doc);

  const context: PdfContext = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    font,
    boldFont,
    logoImage,
    textMode,
    locale: data.locale,
    y: PAGE_HEIGHT - MARGIN,
    pageIndex: 1
  };

  drawCover(context, data);
  addPage(context);
  drawBody(context, data);

  doc.getPages().forEach((page, index) => drawFooter(page, font, index + 1));
  const bytes = await doc.save();
  return Buffer.from(bytes);
}
