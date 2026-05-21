const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const toBengaliDigits = (num: number | string): string => {
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[Number(digit)]);
};

export function formatCurrency(amount: number): string {
  return (
    "৳" +
    toBengaliDigits(
      amount.toLocaleString("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    )
  );
}

const monthsShortBn: Record<string, string> = {
  Jan: "জানু",
  Feb: "ফেব্রু",
  Mar: "মার্চ",
  Apr: "এপ্রিল",
  May: "মে",
  Jun: "জুন",
  Jul: "জুলাই",
  Aug: "আগস্ট",
  Sep: "সেপ্টে",
  Oct: "অক্টো",
  Nov: "নভে",
  Dec: "ডিসে",
};

const monthsFullBn: Record<string, string> = {
  January: "জানুয়ারি",
  February: "ফেব্রুয়ারি",
  March: "মার্চ",
  April: "এপ্রিল",
  May: "মে",
  June: "জুন",
  July: "জুলাই",
  August: "আগস্ট",
  September: "সেপ্টেম্বর",
  October: "অক্টোবর",
  November: "নভেম্বর",
  December: "ডিসেম্বর",
};

// Consistent date formatting that avoids hydration mismatch
export const formatBengaliDate = (
  dateStr: string,
  options: { month?: "short" | "long"; includeYear?: boolean; day?: "numeric" | "2-digit" } = {}
): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const dayVal = date.getDate();
  const day = toBengaliDigits(options.day === "2-digit" ? String(dayVal).padStart(2, "0") : dayVal);
  const year = toBengaliDigits(date.getFullYear());

  // Get English month name first
  const monthNameEn = date.toLocaleString("en-US", {
    month: options.month === "long" ? "long" : "short",
  });

  const monthNameBn =
    options.month === "long"
      ? monthsFullBn[monthNameEn] || monthNameEn
      : monthsShortBn[monthNameEn] || monthNameEn;

  if (options.includeYear) {
    return `${day} ${monthNameBn}, ${year}`;
  }
  return `${day} ${monthNameBn}`;
};

export const itemTypeBn: Record<string, string> = {
  meat: "গোশত",
  chamra: "চামড়া",
  vuri: "ভুঁড়ি",
  pa: "পা",
  other: "অন্যান্য",
};

