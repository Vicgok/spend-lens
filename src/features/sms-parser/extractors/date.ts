const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Extracts transaction date and time from the SMS body.
 * Supports patterns like "DD-MMM-YY", "DD/MM/YYYY", and optional "HH:MM:SS AM/PM".
 * Fallback to the message received date if no date is found or parsing fails.
 * Addresses U1 from reference.
 */
export function extractTransactionDate(rawMessage: string, fallbackDate: string | null): string | null {
  if (!rawMessage) return fallbackDate;

  // Patterns matched:
  // 1. DD-MMM-YY / DD-MMM-YYYY (e.g. 20-May-26, 20-May-2026)
  // 2. DD-MM-YY / DD-MM-YYYY (e.g. 20-05-26, 20/05/2026)
  // 3. YYYY-MM-DD
  const dateRegex = /\b(\d{1,2})[-/]([a-zA-Z]{3}|\d{1,2})[-/](\d{2,4})\b/;
  const match = rawMessage.match(dateRegex);

  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2].toLowerCase();
    let year = parseInt(match[3], 10);

    // Normalize 2-digit years
    if (year < 100) {
      year = year >= 50 ? 1900 + year : 2000 + year;
    }

    let month = -1;
    if (isNaN(parseInt(monthStr, 10))) {
      // Month abbreviation
      const mapped = MONTH_MAP[monthStr.substring(0, 3)];
      if (mapped !== undefined) {
        month = mapped;
      }
    } else {
      month = parseInt(monthStr, 10) - 1; // Date constructor expects 0-indexed month
    }

    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      // Scan for time pattern (e.g., "14:32:10" or "02:30 pm")
      const timeRegex = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i;
      const timeMatch = rawMessage.match(timeRegex);

      let hours = 12;
      let minutes = 0;
      let seconds = 0;

      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        if (timeMatch[3]) {
          seconds = parseInt(timeMatch[3], 10);
        }

        const ampm = timeMatch[4]?.toLowerCase();
        if (ampm === 'pm' && hours < 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
      }

      try {
        const dateObj = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString();
        }
      } catch (e) {
        // Fall back to fallbackDate
      }
    }
  }

  return fallbackDate;
}
