/**
 * cron-talk — natural language ↔ cron expression converter with Arabic support.
 *
 * (c) 2026 Kasim Mohammed — MIT
 */

export interface CronTalkOptions {
  locale?: "en" | "ar" | "auto";
  strict?: boolean;
}

const ARABIC_RE = /[؀-ۿ]/;

function detectLocale(text: string): "en" | "ar" {
  return ARABIC_RE.test(text) ? "ar" : "en";
}

// ─── Day-of-week lookup ───────────────────────────────────────────────
const DOW: Record<string, number> = {
  sunday: 0, sun: 0, "الأحد": 0, "احد": 0,
  monday: 1, mon: 1, "الاثنين": 1, "اثنين": 1,
  tuesday: 2, tue: 2, "الثلاثاء": 2, "ثلاثاء": 2,
  wednesday: 3, wed: 3, "الأربعاء": 3, "اربعاء": 3, "الاربعاء": 3,
  thursday: 4, thu: 4, "الخميس": 4, "خميس": 4,
  friday: 5, fri: 5, "الجمعة": 5, "جمعة": 5,
  saturday: 6, sat: 6, "السبت": 6, "سبت": 6,
};

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, "يناير": 1, "كانون الثاني": 1,
  february: 2, feb: 2, "فبراير": 2, "شباط": 2,
  march: 3, mar: 3, "مارس": 3, "آذار": 3,
  april: 4, apr: 4, "أبريل": 4, "نيسان": 4, "ابريل": 4,
  may: 5, "مايو": 5, "أيار": 5, "ايار": 5,
  june: 6, jun: 6, "يونيو": 6, "حزيران": 6,
  july: 7, jul: 7, "يوليو": 7, "تموز": 7,
  august: 8, aug: 8, "أغسطس": 8, "اب": 8, "آب": 8,
  september: 9, sep: 9, "سبتمبر": 9, "أيلول": 9, "ايلول": 9,
  october: 10, oct: 10, "أكتوبر": 10, "اكتوبر": 10, "تشرين الأول": 10,
  november: 11, nov: 11, "نوفمبر": 11, "تشرين الثاني": 11,
  december: 12, dec: 12, "ديسمبر": 12, "كانون الأول": 12,
};

// ─── Arabic digits → Western ──────────────────────────────────────────
function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
}

function parseTime(text: string): { h: number; m: number } | null {
  // 9am / 9 am / 9:30am / 21:00 / 9 pm / midnight / noon
  const t = normalizeDigits(text.toLowerCase());
  if (/midnight|منتصف الليل/.test(t)) return { h: 0, m: 0 };
  if (/noon|الظهر/.test(t)) return { h: 12, m: 0 };

  const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|صباح|مساء)?/);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = m[2] ? parseInt(m[2], 10) : 0;
  const period = m[3];
  if (period === "pm" || period === "مساء") {
    if (hours < 12) hours += 12;
  } else if (period === "am" || period === "صباح") {
    if (hours === 12) hours = 0;
  }
  if (hours > 23 || minutes > 59) return null;
  return { h: hours, m: minutes };
}

function findDayOfWeek(text: string): number | null {
  const lower = text.toLowerCase();
  for (const [k, v] of Object.entries(DOW)) {
    if (new RegExp(`\\b${k}\\b`, "i").test(lower) || lower.includes(k)) {
      return v;
    }
  }
  return null;
}

function findMonth(text: string): number | null {
  const lower = text.toLowerCase();
  for (const [k, v] of Object.entries(MONTHS)) {
    if (new RegExp(`\\b${k}\\b`, "i").test(lower) || lower.includes(k)) {
      return v;
    }
  }
  return null;
}

// ─── Core ─────────────────────────────────────────────────────────────
export function cronTalk(text: string, opts: CronTalkOptions = {}): string {
  const original = text;
  text = normalizeDigits(text).toLowerCase().trim();
  const locale = opts.locale === "auto" || !opts.locale ? detectLocale(original) : opts.locale;
  const strict = opts.strict ?? false;

  // "every N minutes" / "كل N دقائق"
  let m = text.match(/every\s+(\d+)\s*minute/) || text.match(/كل\s+(\d+)\s*دقيق/);
  if (m) return `*/${m[1]} * * * *`;

  // "every minute" / "كل دقيقة"
  if (/every minute|كل دقيقة/.test(text)) return "* * * * *";

  // "every N hours" / "كل N ساعة"
  m = text.match(/every\s+(\d+)\s*hour/) || text.match(/كل\s+(\d+)\s*ساع/);
  if (m) return `0 */${m[1]} * * *`;

  // "every hour" / "كل ساعة"
  if (/every hour|كل ساعة/.test(text)) return "0 * * * *";

  const time = parseTime(text);
  const hh = time?.h ?? 0;
  const mm = time?.m ?? 0;

  // "first day of every month" / "أول كل شهر" / "كل أول شهر"
  if (/first day of every month|أول كل شهر|كل أول شهر|كل اول شهر/.test(text)) {
    return `${mm} ${hh} 1 * *`;
  }

  // "first <weekday> of every month" → 0 0 * * D#1
  m = text.match(/first\s+(\w+)\s+of every month/);
  if (m) {
    const d = findDayOfWeek(m[1]);
    if (d !== null) return `${mm} ${hh} * * ${d}#1`;
  }

  // weekdays / weekends
  if (/weekday|أيام العمل|ايام العمل/.test(text)) {
    return `${mm} ${hh} * * 1-5`;
  }
  if (/weekend|نهاية الأسبوع|نهاية الاسبوع/.test(text)) {
    return `${mm} ${hh} * * 6,0`;
  }

  // Day of week explicit
  const dow = findDayOfWeek(text);
  if (dow !== null) {
    return `${mm} ${hh} * * ${dow}`;
  }

  // Month explicit
  const month = findMonth(text);
  if (month !== null) {
    return `${mm} ${hh} 1 ${month} *`;
  }

  // "every day at ..."
  if (/every day|كل يوم/.test(text)) {
    return `${mm} ${hh} * * *`;
  }

  // "every week"
  if (/every week|كل أسبوع|كل اسبوع/.test(text)) {
    return `${mm} ${hh} * * 0`;
  }

  // "every month"
  if (/every month|كل شهر/.test(text)) {
    return `${mm} ${hh} 1 * *`;
  }

  // "every year" / "annually"
  if (/every year|annually|كل سنة|سنوي/.test(text)) {
    return `${mm} ${hh} 1 1 *`;
  }

  if (strict) {
    throw new Error(`Could not parse cron expression from: ${original}`);
  }

  // Best-effort fallback
  return `${mm} ${hh} * * *`;
}

cronTalk.explain = function explain(cron: string, locale: "en" | "ar" = "en"): string {
  const [m, h, dom, mon, dow] = cron.trim().split(/\s+/);
  const parts: string[] = [];

  if (m === "*" && h === "*") parts.push(locale === "ar" ? "كل دقيقة" : "every minute");
  else if (m.startsWith("*/")) parts.push(locale === "ar" ? `كل ${m.slice(2)} دقيقة` : `every ${m.slice(2)} minutes`);
  else if (h === "*") parts.push(locale === "ar" ? `الدقيقة ${m} من كل ساعة` : `minute ${m} of every hour`);
  else if (h.startsWith("*/")) parts.push(locale === "ar" ? `كل ${h.slice(2)} ساعات` : `every ${h.slice(2)} hours`);
  else parts.push(locale === "ar" ? `الساعة ${h}:${m.padStart(2, "0")}` : `at ${h}:${m.padStart(2, "0")}`);

  if (dow === "1-5") parts.push(locale === "ar" ? "كل يوم عمل" : "every weekday");
  else if (dow === "6,0" || dow === "0,6") parts.push(locale === "ar" ? "في عطلة نهاية الأسبوع" : "on weekends");
  else if (dow !== "*") {
    const dayName = Object.entries(DOW).find(([_, v]) => String(v) === dow)?.[0] ?? `day ${dow}`;
    parts.push(locale === "ar" ? `يوم ${dayName}` : `on ${dayName}`);
  } else if (dom !== "*") {
    parts.push(locale === "ar" ? `يوم ${dom} من الشهر` : `on day ${dom} of the month`);
  }

  return parts.join(" ");
};

cronTalk.validate = function validate(cron: string): { valid: boolean; reason?: string } {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5) {
    return { valid: false, reason: `Expected 5 fields, got ${fields.length}` };
  }
  const ranges: [number, number, string][] = [
    [0, 59, "Minute"],
    [0, 23, "Hour"],
    [1, 31, "Day"],
    [1, 12, "Month"],
    [0, 7, "Day of week"],
  ];
  for (let i = 0; i < 5; i++) {
    const [lo, hi, name] = ranges[i];
    const f = fields[i];
    if (f === "*") continue;
    if (f.startsWith("*/")) {
      const step = parseInt(f.slice(2), 10);
      if (isNaN(step) || step < 1) return { valid: false, reason: `${name} step invalid` };
      continue;
    }
    for (const part of f.split(",")) {
      for (const sub of part.split("-")) {
        const n = parseInt(sub.split("#")[0], 10);
        if (isNaN(n) || n < lo || n > hi) {
          return { valid: false, reason: `${name} must be ${lo}–${hi}` };
        }
      }
    }
  }
  return { valid: true };
};

cronTalk.next = function next(cron: string, from: Date = new Date()): Date {
  // Naive iterative match — good enough for common patterns
  const [mF, hF, domF, monF, dowF] = cron.trim().split(/\s+/);
  const matches = (v: number, f: string, lo: number, hi: number): boolean => {
    if (f === "*") return true;
    if (f.startsWith("*/")) return v % parseInt(f.slice(2), 10) === 0;
    for (const part of f.split(",")) {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map(Number);
        if (v >= a && v <= b) return true;
      } else if (parseInt(part, 10) === v) return true;
    }
    return false;
  };

  const d = new Date(from.getTime() + 60_000);
  d.setSeconds(0, 0);
  for (let i = 0; i < 525_600; i++) { // up to a year of minutes
    if (
      matches(d.getMinutes(), mF, 0, 59) &&
      matches(d.getHours(), hF, 0, 23) &&
      matches(d.getDate(), domF, 1, 31) &&
      matches(d.getMonth() + 1, monF, 1, 12) &&
      matches(d.getDay(), dowF, 0, 7)
    ) {
      return d;
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  throw new Error("No match within a year");
};

export default cronTalk;
