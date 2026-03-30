import { ExpenseCategory, PaymentMedium } from './types';

interface ParsedSMS {
  amount: number | null;
  merchant: string;
  paymentMedium: PaymentMedium;
  cardInfo: string;
  category: ExpenseCategory;
}

const MERCHANT_CATEGORY_MAP: Record<string, ExpenseCategory> = {
  swiggy: 'food',
  zomato: 'food',
  dominos: 'food',
  mcdonalds: 'food',
  starbucks: 'food',
  kfc: 'food',
  'burger king': 'food',
  subway: 'food',
  dunkin: 'food',
  blinkit: 'groceries',
  bigbasket: 'groceries',
  zepto: 'groceries',
  instamart: 'groceries',
  jiomart: 'groceries',
  dmart: 'groceries',
  grofers: 'groceries',
  amazon: 'shopping',
  flipkart: 'shopping',
  myntra: 'shopping',
  ajio: 'shopping',
  nykaa: 'shopping',
  meesho: 'shopping',
  snapdeal: 'shopping',
  uber: 'transport',
  ola: 'transport',
  rapido: 'transport',
  irctc: 'travel',
  makemytrip: 'travel',
  goibibo: 'travel',
  cleartrip: 'travel',
  netflix: 'entertainment',
  hotstar: 'entertainment',
  spotify: 'entertainment',
  'prime video': 'entertainment',
  bookmyshow: 'entertainment',
  jio: 'bills',
  airtel: 'bills',
  vodafone: 'bills',
  vi: 'bills',
  bsnl: 'bills',
  electricity: 'bills',
  bescom: 'bills',
  gas: 'bills',
  water: 'bills',
  broadband: 'bills',
  apollo: 'health',
  pharmeasy: 'health',
  netmeds: 'health',
  '1mg': 'health',
  medplus: 'health',
  practo: 'health',
  udemy: 'education',
  coursera: 'education',
  unacademy: 'education',
  byju: 'education',
};

const BANK_KEYWORDS = [
  'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes', 'bob', 'pnb',
  'canara', 'idbi', 'rbl', 'indusind', 'federal', 'bandhan',
  'bank', 'card', 'credit', 'debit', 'account', 'a/c', 'acct',
  'ending', 'xx', 'linked',
];

function extractAmount(text: string): number | null {
  const patterns = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
    /(?:spent|debited|paid|charged|purchase|transaction)\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:amount|amt)\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (amount > 0 && amount < 10000000) {
        return amount;
      }
    }
  }
  return null;
}

function extractPaymentMedium(text: string): { medium: PaymentMedium; cardInfo: string } {
  const lower = text.toLowerCase();

  const cardMatch = text.match(/(?:card|cc|credit\s*card)\s*(?:ending\s*(?:with\s*)?|xx|x+)?\s*(\d{4})/i) ||
    text.match(/(\d{4})\s*(?:card|cc)/i) ||
    text.match(/(?:hdfc|icici|sbi|axis|kotak|yes|bob|pnb|canara|idbi|rbl|indusind|federal|bandhan)\s*(?:bank\s*)?(?:card|cc)\s*(?:ending\s*)?(?:xx)?(\d{4})/i);

  if (cardMatch) {
    const last4 = cardMatch[1];
    if (lower.includes('credit')) {
      return { medium: 'credit_card', cardInfo: `Card ending ${last4}` };
    }
    return { medium: 'debit_card', cardInfo: `Card ending ${last4}` };
  }

  if (/\b(?:upi|gpay|google\s*pay|phonepe|paytm|bhim)\b/i.test(text)) {
    return { medium: 'upi', cardInfo: '' };
  }
  if (/\bnet\s*banking\b/i.test(text)) {
    return { medium: 'net_banking', cardInfo: '' };
  }
  if (/\bwallet\b/i.test(text)) {
    return { medium: 'wallet', cardInfo: '' };
  }
  if (/\bcash\b/i.test(text)) {
    return { medium: 'cash', cardInfo: '' };
  }
  if (/\bcredit\b/i.test(text)) {
    return { medium: 'credit_card', cardInfo: '' };
  }
  if (/\bdebit\b/i.test(text)) {
    return { medium: 'debit_card', cardInfo: '' };
  }

  return { medium: 'other', cardInfo: '' };
}

function isBankRelated(phrase: string): boolean {
  const lower = phrase.toLowerCase();
  return BANK_KEYWORDS.some(kw => lower.includes(kw)) || /\d{4}/.test(phrase);
}

function extractMerchant(text: string): string {
  const lower = text.toLowerCase();
  for (const [key] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    const idx = lower.indexOf(key.toLowerCase());
    if (idx !== -1) {
      const original = text.substring(idx, idx + key.length);
      return original.charAt(0).toUpperCase() + original.slice(1);
    }
  }

  const allMatches: { phrase: string; index: number }[] = [];
  const regex = /\b(?:at|on|to|from|@|towards)\s+([a-zA-Z][a-zA-Z0-9\s&'./-]{1,30}?)(?=\s*(?:on|at|for|via|ref|txn|transaction|upi|dated|[.,;]|$))/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const phrase = match[1].trim().replace(/[.\s]+$/, '');
    if (phrase.length > 1 && !/^(your|the|a|an|rs|inr)$/i.test(phrase)) {
      allMatches.push({ phrase, index: match.index });
    }
  }

  const nonBankMatches = allMatches.filter(m => !isBankRelated(m.phrase));
  if (nonBankMatches.length > 0) {
    return nonBankMatches[nonBankMatches.length - 1].phrase;
  }

  const infoMatch = text.match(/(?:info:\s*)([a-zA-Z][a-zA-Z0-9\s&'./-]{1,30}?)(?:\s*$)/im);
  if (infoMatch) {
    const merchant = infoMatch[1].trim().replace(/[.\s]+$/, '');
    if (merchant.length > 1 && !isBankRelated(merchant)) {
      return merchant;
    }
  }

  const merchantMatch = text.match(/(?:merchant|vendor|payee)\s*:?\s*([a-zA-Z][a-zA-Z0-9\s&'./-]{1,30})/i);
  if (merchantMatch) {
    const merchant = merchantMatch[1].trim();
    if (!isBankRelated(merchant)) {
      return merchant;
    }
  }

  return '';
}

function guessCategory(text: string, merchant: string): ExpenseCategory {
  const lower = (text + ' ' + merchant).toLowerCase();

  for (const [key, category] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lower.includes(key)) {
      return category;
    }
  }

  if (/\b(?:food|restaurant|cafe|dine|eat|meal|snack|pizza|burger|biryani|thali|chai|coffee)\b/i.test(lower)) return 'food';
  if (/\b(?:grocery|supermarket|mart|kirana|vegetables|fruits)\b/i.test(lower)) return 'groceries';
  if (/\b(?:shop|store|mall|purchase|buy|fashion|clothing|shoes|accessories)\b/i.test(lower)) return 'shopping';
  if (/\b(?:cab|taxi|auto|ride|fuel|petrol|diesel|parking|toll|metro|bus)\b/i.test(lower)) return 'transport';
  if (/\b(?:bill|recharge|electricity|gas|water|rent|insurance|emi|loan)\b/i.test(lower)) return 'bills';
  if (/\b(?:movie|cinema|game|concert|show|ticket|subscription)\b/i.test(lower)) return 'entertainment';
  if (/\b(?:hospital|doctor|medicine|pharmacy|clinic|dental|lab|test|scan)\b/i.test(lower)) return 'health';
  if (/\b(?:flight|hotel|travel|booking|trip|vacation|tour)\b/i.test(lower)) return 'travel';
  if (/\b(?:course|class|tuition|book|exam|study|school|college|university)\b/i.test(lower)) return 'education';

  return 'other';
}

function extractDate(text: string): string | null {
  const patterns = [
    /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
    /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/,
    /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})/i,
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[\s,]+(\d{4})/i,
    /(\d{2})-([A-Za-z]{3})-(\d{4})/,
    /(\d{2})([A-Za-z]{3})(\d{4})/,
  ];

  const monthNames: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    let day: number, month: number, year: number;
    const m = match;

    if (/\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(m[0])) {
      year = parseInt(m[1]); month = parseInt(m[2]) - 1; day = parseInt(m[3]);
    } else if (/\d{1,2}\s+[A-Za-z]+/i.test(m[0])) {
      day = parseInt(m[1]);
      month = monthNames[m[2].toLowerCase().slice(0, 3)] ?? 0;
      year = parseInt(m[3]);
    } else if (/[A-Za-z]+\s+\d{1,2}/i.test(m[0])) {
      month = monthNames[m[1].toLowerCase().slice(0, 3)] ?? 0;
      day = parseInt(m[2]);
      year = parseInt(m[3]);
    } else if (/\d{2}[A-Za-z]{3}\d{4}/.test(m[0])) {
      day = parseInt(m[1]);
      month = monthNames[m[2].toLowerCase()] ?? 0;
      year = parseInt(m[3]);
    } else {
      day = parseInt(m[1]); month = parseInt(m[2]) - 1;
      const rawYear = parseInt(m[3]);
      year = rawYear < 100 ? 2000 + rawYear : rawYear;
    }

    const date = new Date(year, month, day);
    if (isNaN(date.getTime()) || year < 2000 || year > 2100) continue;
    return date.toISOString();
  }
  return null;
}

interface ParsedSMSWithDate extends ParsedSMS {
  date: string | null;
}

export function parseSMS(smsText: string): ParsedSMSWithDate {
  const amount = extractAmount(smsText);
  const { medium, cardInfo } = extractPaymentMedium(smsText);
  const merchant = extractMerchant(smsText);
  const category = guessCategory(smsText, merchant);
  const date = extractDate(smsText);

  return {
    amount,
    merchant,
    paymentMedium: medium,
    cardInfo,
    category,
    date,
  };
}
