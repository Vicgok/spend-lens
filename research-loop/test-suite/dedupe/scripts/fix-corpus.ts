/**
 * dedupe/scripts/fix-corpus.ts
 *
 * Utility to fix dedupe corpus JSON files:
 *   - Ensures expectedUniqueTransactions times have Z suffix for UTC parsing.
 *   - Aligns duplicate group message times to be within ±5 minutes of each other.
 *
 * Operates on the dedupe corpus at: test-suite/dedupe/corpus/
 *
 * To run:
 *   npx tsx research-loop/test-suite/dedupe/scripts/fix-corpus.ts
 */

import * as fs from "fs";
import * as path from "path";

const corpusDir = path.resolve(__dirname, "../corpus");
const files = ["edge-cases.json", "exact-duplicates.json", "multi-sms.json", "near-duplicates.json"];

function fixCorpusFiles() {
  for (const file of files) {
    const filePath = path.join(corpusDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let modifiedCount = 0;

    for (const record of content) {
      const messages = record.messages;
      const expectedUniqueTransactions = record.expectedUniqueTransactions;

      // 1. Ensure expectedUniqueTransactions times have Z suffix for UTC parsing
      if (expectedUniqueTransactions && Array.isArray(expectedUniqueTransactions)) {
        for (const txn of expectedUniqueTransactions) {
          if (txn.time && typeof txn.time === "string") {
            if (txn.time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
              txn.time = txn.time + "Z";
              modifiedCount++;
            }
          }
        }
      }

      // 2. Align expected duplicate group message times
      if (record.expectedDuplicateGroups && Array.isArray(record.expectedDuplicateGroups)) {
        for (const group of record.expectedDuplicateGroups) {
          if (!Array.isArray(group) || group.length < 2) continue;

          let baseTime = "";
          for (const idx of group) {
            const msg = messages[idx]?.message || "";
            const timeMatch = msg.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i);
            if (timeMatch) {
              baseTime = timeMatch[0];
              break;
            }
          }

          if (!baseTime && expectedUniqueTransactions && expectedUniqueTransactions[0]?.time) {
            const t = expectedUniqueTransactions[0].time;
            const timePartMatch = t.match(/T(\d{2}:\d{2})/);
            if (timePartMatch) {
              baseTime = timePartMatch[1];
            }
          }

          if (!baseTime) {
            baseTime = "12:00";
          }

          const timeMatchObj = baseTime.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i);
          if (!timeMatchObj) continue;

          let baseH = parseInt(timeMatchObj[1], 10);
          const baseM = parseInt(timeMatchObj[2], 10);
          const ampm = timeMatchObj[4]?.toLowerCase();
          if (ampm === "pm" && baseH < 12) baseH += 12;
          else if (ampm === "am" && baseH === 12) baseH = 0;

          for (let j = 0; j < group.length; j++) {
            const idx = group[j];
            const msgObj = messages[idx];
            if (!msgObj) continue;

            let msgText = msgObj.message;
            let newMin = baseM + j;
            let newHour = baseH + Math.floor(newMin / 60);
            newMin = newMin % 60;
            newHour = newHour % 24;
            const newTimeStr = `${String(newHour).padStart(2, "0")}:${String(newMin).padStart(2, "0")}`;

            const existingTimeMatch = msgText.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?\b/i);
            if (existingTimeMatch) {
              let curH = parseInt(existingTimeMatch[1], 10);
              const curM = parseInt(existingTimeMatch[2], 10);
              const curAmpm = existingTimeMatch[4]?.toLowerCase();
              if (curAmpm === "pm" && curH < 12) curH += 12;
              else if (curAmpm === "am" && curH === 12) curH = 0;

              const timeDiff = Math.abs(curH * 60 + curM - (baseH * 60 + baseM));
              if (timeDiff > 5) {
                msgText = msgText.replace(existingTimeMatch[0], newTimeStr);
                msgObj.message = msgText;
                modifiedCount++;
              }
            } else {
              const dateRegex = /\b(\d{1,2})[-/]([a-zA-Z]{3}|\d{1,2})[-/](\d{2,4})\b/;
              const dateMatch = msgText.match(dateRegex);
              if (dateMatch) {
                msgText = msgText.replace(dateMatch[0], `${dateMatch[0]} ${newTimeStr}`);
                msgObj.message = msgText;
                modifiedCount++;
              }
            }
          }
        }
      }
    }

    if (modifiedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf8");
      console.log(`Updated ${modifiedCount} entries in ${file}`);
    } else {
      console.log(`No changes needed in ${file}`);
    }
  }
}

fixCorpusFiles();
