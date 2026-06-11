const BLOCKED_TERMS = [
  'ควย',
  'เหี้ย',
  'สัส',
  'สัด',
  'หี',
  'เย็ด',
  'ข่มขืน',
  'ฆ่า',
  'fuck',
  'shit',
  'bitch',
  'porn',
  'xxx',
];

const LINK_PATTERN = /(https?:\/\/|www\.|\.com|\.net|\.co|\.io|bit\.ly|line\.me|t\.me)/i;
const CONTACT_PATTERN = /(\+?\d[\d\s-]{7,}\d|@\w{3,})/;
const REPEATED_CHARACTER_PATTERN = /(.)\1{7,}/u;

function normalizeMessage(message) {
  return message
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasBlockedTerm(message) {
  const normalized = message.toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

export function validateMoonMessage(message) {
  const cleanMessage = normalizeMessage(message);

  if (!cleanMessage) {
    return {
      isValid: false,
      message: cleanMessage,
      error: 'ฝากไว้สักหนึ่งประโยคก่อนนะ',
    };
  }

  if (cleanMessage.length < 4) {
    return {
      isValid: false,
      message: cleanMessage,
      error: 'ขอข้อความยาวกว่านี้อีกนิดนะ',
    };
  }

  if (LINK_PATTERN.test(cleanMessage) || CONTACT_PATTERN.test(cleanMessage)) {
    return {
      isValid: false,
      message: cleanMessage,
      error: 'ตอนนี้ยังไม่รับลิงก์ เบอร์โทร หรือ @contact ในข้อความนะ',
    };
  }

  if (REPEATED_CHARACTER_PATTERN.test(cleanMessage)) {
    return {
      isValid: false,
      message: cleanMessage,
      error: 'ข้อความดูซ้ำยาวเกินไป ลองเขียนให้เป็นประโยคอีกนิดนะ',
    };
  }

  if (hasBlockedTerm(cleanMessage)) {
    return {
      isValid: false,
      message: cleanMessage,
      error: 'ข้อความนี้อาจแรงเกินไปสำหรับพระจันทร์ ลองปรับให้นุ่มลงอีกนิดนะ',
    };
  }

  return {
    isValid: true,
    message: cleanMessage,
    error: '',
  };
}
