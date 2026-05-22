"""cron-talk core — natural language ↔ cron expression."""

import re
from datetime import datetime, timedelta


ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

DOW = {
    "sunday": 0, "sun": 0, "الأحد": 0, "احد": 0,
    "monday": 1, "mon": 1, "الاثنين": 1, "اثنين": 1,
    "tuesday": 2, "tue": 2, "الثلاثاء": 2, "ثلاثاء": 2,
    "wednesday": 3, "wed": 3, "الأربعاء": 3, "اربعاء": 3, "الاربعاء": 3,
    "thursday": 4, "thu": 4, "الخميس": 4, "خميس": 4,
    "friday": 5, "fri": 5, "الجمعة": 5, "جمعة": 5,
    "saturday": 6, "sat": 6, "السبت": 6, "سبت": 6,
}

MONTHS = {
    "january": 1, "jan": 1, "يناير": 1,
    "february": 2, "feb": 2, "فبراير": 2,
    "march": 3, "mar": 3, "مارس": 3,
    "april": 4, "apr": 4, "أبريل": 4, "ابريل": 4,
    "may": 5, "مايو": 5,
    "june": 6, "jun": 6, "يونيو": 6,
    "july": 7, "jul": 7, "يوليو": 7,
    "august": 8, "aug": 8, "أغسطس": 8,
    "september": 9, "sep": 9, "سبتمبر": 9,
    "october": 10, "oct": 10, "أكتوبر": 10, "اكتوبر": 10,
    "november": 11, "nov": 11, "نوفمبر": 11,
    "december": 12, "dec": 12, "ديسمبر": 12,
}


def _normalize(text: str) -> str:
    return text.translate(ARABIC_DIGITS).lower().strip()


def _parse_time(text: str) -> tuple[int, int] | None:
    if re.search(r"midnight|منتصف الليل", text):
        return 0, 0
    if re.search(r"noon|الظهر", text):
        return 12, 0
    m = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm|صباح|مساء)?", text)
    if not m:
        return None
    h = int(m.group(1))
    mm = int(m.group(2) or 0)
    period = m.group(3)
    if period in ("pm", "مساء"):
        if h < 12:
            h += 12
    elif period in ("am", "صباح"):
        if h == 12:
            h = 0
    if h > 23 or mm > 59:
        return None
    return h, mm


def _find_dow(text: str) -> int | None:
    for k, v in DOW.items():
        if k in text:
            return v
    return None


def _find_month(text: str) -> int | None:
    for k, v in MONTHS.items():
        if k in text:
            return v
    return None


def cron_talk(text: str, locale: str = "auto", strict: bool = False) -> str:
    """Convert natural-language phrase to a 5-field cron expression."""
    original = text
    t = _normalize(text)

    m = re.search(r"every\s+(\d+)\s*minute", t) or re.search(r"كل\s+(\d+)\s*دقيق", t)
    if m:
        return f"*/{m.group(1)} * * * *"

    if re.search(r"every minute|كل دقيقة", t):
        return "* * * * *"

    m = re.search(r"every\s+(\d+)\s*hour", t) or re.search(r"كل\s+(\d+)\s*ساع", t)
    if m:
        return f"0 */{m.group(1)} * * *"

    if re.search(r"every hour|كل ساعة", t):
        return "0 * * * *"

    time = _parse_time(t)
    hh, mm = (time[0], time[1]) if time else (0, 0)

    if re.search(r"first day of every month|أول كل شهر|كل أول شهر|كل اول شهر", t):
        return f"{mm} {hh} 1 * *"

    m = re.search(r"first\s+(\w+)\s+of every month", t)
    if m:
        d = _find_dow(m.group(1))
        if d is not None:
            return f"{mm} {hh} * * {d}#1"

    if re.search(r"weekday|أيام العمل|ايام العمل", t):
        return f"{mm} {hh} * * 1-5"

    if re.search(r"weekend|نهاية الأسبوع|نهاية الاسبوع", t):
        return f"{mm} {hh} * * 6,0"

    dow = _find_dow(t)
    if dow is not None:
        return f"{mm} {hh} * * {dow}"

    month = _find_month(t)
    if month is not None:
        return f"{mm} {hh} 1 {month} *"

    if re.search(r"every day|كل يوم", t):
        return f"{mm} {hh} * * *"

    if re.search(r"every week|كل أسبوع|كل اسبوع", t):
        return f"{mm} {hh} * * 0"

    if re.search(r"every month|كل شهر", t):
        return f"{mm} {hh} 1 * *"

    if re.search(r"every year|annually|كل سنة|سنوي", t):
        return f"{mm} {hh} 1 1 *"

    if strict:
        raise ValueError(f"Could not parse cron expression from: {original}")

    return f"{mm} {hh} * * *"


def explain(cron: str, locale: str = "en") -> str:
    parts = cron.strip().split()
    if len(parts) != 5:
        return cron
    m, h, dom, mon, dow = parts
    out: list[str] = []

    if m == "*" and h == "*":
        out.append("كل دقيقة" if locale == "ar" else "every minute")
    elif m.startswith("*/"):
        out.append(f"كل {m[2:]} دقيقة" if locale == "ar" else f"every {m[2:]} minutes")
    elif h == "*":
        out.append(f"الدقيقة {m} من كل ساعة" if locale == "ar" else f"minute {m} of every hour")
    elif h.startswith("*/"):
        out.append(f"كل {h[2:]} ساعات" if locale == "ar" else f"every {h[2:]} hours")
    else:
        out.append(f"الساعة {h}:{m.zfill(2)}" if locale == "ar" else f"at {h}:{m.zfill(2)}")

    if dow == "1-5":
        out.append("كل يوم عمل" if locale == "ar" else "every weekday")
    elif dow in ("6,0", "0,6"):
        out.append("في عطلة نهاية الأسبوع" if locale == "ar" else "on weekends")
    elif dow != "*":
        out.append(f"يوم {dow}" if locale == "ar" else f"on day {dow}")
    elif dom != "*":
        out.append(f"يوم {dom} من الشهر" if locale == "ar" else f"on day {dom} of the month")

    return " ".join(out)


def validate(cron: str) -> dict:
    fields = cron.strip().split()
    if len(fields) != 5:
        return {"valid": False, "reason": f"Expected 5 fields, got {len(fields)}"}
    ranges = [(0, 59, "Minute"), (0, 23, "Hour"), (1, 31, "Day"), (1, 12, "Month"), (0, 7, "Day of week")]
    for i, (lo, hi, name) in enumerate(ranges):
        f = fields[i]
        if f == "*":
            continue
        if f.startswith("*/"):
            try:
                step = int(f[2:])
                if step < 1:
                    raise ValueError
            except ValueError:
                return {"valid": False, "reason": f"{name} step invalid"}
            continue
        for part in f.split(","):
            for sub in part.split("-"):
                try:
                    n = int(sub.split("#")[0])
                except ValueError:
                    return {"valid": False, "reason": f"{name} invalid value: {sub}"}
                if not (lo <= n <= hi):
                    return {"valid": False, "reason": f"{name} must be {lo}–{hi}"}
    return {"valid": True}


def next_time(cron: str, from_dt: datetime | None = None) -> datetime:
    parts = cron.strip().split()
    if len(parts) != 5:
        raise ValueError("invalid cron expression")
    m_f, h_f, dom_f, mon_f, dow_f = parts

    def matches(v: int, f: str, lo: int, hi: int) -> bool:
        if f == "*":
            return True
        if f.startswith("*/"):
            return v % int(f[2:]) == 0
        for part in f.split(","):
            if "-" in part:
                a, b = (int(x) for x in part.split("-"))
                if a <= v <= b:
                    return True
            elif int(part.split("#")[0]) == v:
                return True
        return False

    start = (from_dt or datetime.now()).replace(second=0, microsecond=0) + timedelta(minutes=1)
    cur = start
    for _ in range(525_600):
        if (
            matches(cur.minute, m_f, 0, 59) and
            matches(cur.hour, h_f, 0, 23) and
            matches(cur.day, dom_f, 1, 31) and
            matches(cur.month, mon_f, 1, 12) and
            matches(cur.weekday() if dow_f == "1-5" else (cur.isoweekday() % 7), dow_f, 0, 7)
        ):
            return cur
        cur += timedelta(minutes=1)
    raise RuntimeError("No match within a year")
