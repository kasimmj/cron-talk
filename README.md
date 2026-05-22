<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,24,8,20&height=200&section=header&text=cron-talk&fontSize=72&fontColor=ffffff&animation=fadeIn&desc=Natural%20language%20%E2%86%92%20Cron%20expressions%20%E2%80%94%20with%20Arabic%20support&descSize=17&descAlignY=70"/>

<br/>

<p>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/Bilingual-006C35?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Zero%20Deps-000000?style=for-the-badge"/>
</p>

<p>
<img src="https://img.shields.io/github/stars/kasimmj/cron-talk?style=social"/>
<img src="https://img.shields.io/github/forks/kasimmj/cron-talk?style=social"/>
</p>

**Stop memorizing cron syntax.**
Write what you mean, in English or Arabic, and get a valid cron expression.

```js
cronTalk("every monday at 9am")          // → "0 9 * * 1"
cronTalk("كل يوم اثنين الساعة 9")          // → "0 9 * * 1"
cronTalk("every 15 minutes")             // → "*/15 * * * *"
cronTalk("first day of every month")     // → "0 0 1 * *"
cronTalk("weekdays at 7:30am")           // → "30 7 * * 1-5"
```

[Install](#-install) • [Examples](#-examples) • [Supported phrases](#-supported-phrases) • [API](#-api)

</div>

---

## ⚡ Install

### JavaScript / TypeScript
```bash
npm install cron-talk
```

### Python
```bash
pip install cron-talk
```

---

## 🎯 Examples

```ts
import { cronTalk } from "cron-talk";

cronTalk("every day at midnight")          // "0 0 * * *"
cronTalk("every hour")                     // "0 * * * *"
cronTalk("every 5 minutes")                // "*/5 * * * *"
cronTalk("every weekday at 9am")           // "0 9 * * 1-5"
cronTalk("every saturday")                 // "0 0 * * 6"
cronTalk("every january")                  // "0 0 1 1 *"
cronTalk("first monday of every month")    // "0 0 * * 1#1"

// Arabic — first library to support it natively:
cronTalk("كل خمس دقائق")                    // "*/5 * * * *"
cronTalk("كل يوم الساعة منتصف الليل")        // "0 0 * * *"
cronTalk("كل جمعة الساعة 8 مساءً")           // "0 20 * * 5"
cronTalk("كل أول شهر")                       // "0 0 1 * *"
```

---

## 📜 Supported phrases

### Frequencies
| Phrase (EN) | Phrase (AR) | Cron |
|-------------|-------------|------|
| every minute | كل دقيقة | `* * * * *` |
| every N minutes | كل N دقائق | `*/N * * * *` |
| every hour | كل ساعة | `0 * * * *` |
| every N hours | كل N ساعات | `0 */N * * *` |
| every day | كل يوم | `0 0 * * *` |
| every week | كل أسبوع | `0 0 * * 0` |
| every month | كل شهر | `0 0 1 * *` |
| every year | كل سنة | `0 0 1 1 *` |

### Days
| English | العربية |
|---------|---------|
| monday | الاثنين / اثنين |
| tuesday | الثلاثاء / ثلاثاء |
| wednesday | الأربعاء / اربعاء |
| thursday | الخميس / خميس |
| friday | الجمعة / جمعة |
| saturday | السبت / سبت |
| sunday | الأحد / احد |
| weekday | أيام العمل |
| weekend | عطلة نهاية الأسبوع |

### Times
- `9am`, `9:00 am`, `09:00`, `9pm`, `21:00`
- `midnight` / `منتصف الليل`
- `noon` / `الظهر`
- `الساعة 8 صباحاً`, `الساعة 8 مساءً`

---

## 🔧 API

### `cronTalk(text: string, opts?): string`

Converts natural language to a 5-field cron expression.

```ts
import { cronTalk } from "cron-talk";

cronTalk("every 30 minutes");                  // "*/30 * * * *"
cronTalk("كل يوم 8 صباحاً", { locale: "ar" }); // explicit locale
```

Options:
- `locale?: "en" | "ar" | "auto"` (default: `"auto"` — detects from input)
- `strict?: boolean` (default: `false` — throws on unknown phrases instead of best-effort)

### `cronTalk.explain(cron: string, locale?): string`

Reverse: cron → human-readable.

```ts
cronTalk.explain("*/15 * * * *");           // "every 15 minutes"
cronTalk.explain("0 9 * * 1-5", "ar");      // "كل يوم عمل الساعة 9 صباحاً"
```

### `cronTalk.next(cron: string, from?: Date): Date`

Returns the next time the cron will fire.

```ts
cronTalk.next("0 9 * * 1");
// → Date of next Monday at 9:00 AM
```

### `cronTalk.validate(cron: string): { valid: boolean; reason?: string }`

```ts
cronTalk.validate("0 9 * * 1");
// → { valid: true }
cronTalk.validate("0 25 * * *");
// → { valid: false, reason: "Hour must be 0–23" }
```

---

## 🌐 Python parity

The Python package exposes the same API:

```python
from cron_talk import cron_talk, explain, next_time, validate

cron_talk("every monday at 9am")         # "0 9 * * 1"
cron_talk("كل اثنين الساعة 9 صباحاً")    # "0 9 * * 1"
explain("0 9 * * 1-5")                   # "every weekday at 9 AM"
next_time("0 9 * * 1")                   # datetime(...)
validate("0 9 * * 1")                    # {"valid": True}
```

---

## 🌟 Why cron-talk?

| Existing libs | cron-talk |
|---------------|-----------|
| English-only | ✅ English + Arabic |
| Heavy deps | ✅ Zero runtime deps |
| One language | ✅ TS + Python parity |
| No `.explain()` | ✅ Full reverse parser |

---

## 📜 License

[MIT](LICENSE) © 2026 [Kasim Mohammed](https://github.com/kasimmj)

---

<div align="center">

**Star ⭐ to never read a cron man-page again.**

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,24,8,20&height=100&section=footer"/>

</div>
