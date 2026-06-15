const LUNAR_CYCLE_DAYS = 29.530588853;
const KNOWN_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 1000 * 60 * 60 * 24;

const PHASES = [
  {
    maxAge: 1.84566,
    name: 'New Moon',
    thaiName: 'เดือนดับ',
    tone: 'พระจันทร์เก็บแสงไว้เกือบทั้งหมด',
  },
  {
    maxAge: 5.53699,
    name: 'Waxing Crescent',
    thaiName: 'ข้างขึ้นเสี้ยวบาง',
    tone: 'แสงเริ่มกลับมาอย่างเงียบๆ',
  },
  {
    maxAge: 9.22831,
    name: 'First Quarter',
    thaiName: 'ข้างขึ้นครึ่งดวง',
    tone: 'ครึ่งหนึ่งของคืนเริ่มสว่าง',
  },
  {
    maxAge: 12.91963,
    name: 'Waxing Gibbous',
    thaiName: 'ข้างขึ้นเกือบเต็มดวง',
    tone: 'พระจันทร์กำลังใกล้เต็มดวง',
  },
  {
    maxAge: 16.61096,
    name: 'Full Moon',
    thaiName: 'พระจันทร์เต็มดวง',
    tone: 'คืนนี้พระจันทร์เปิดแสงเกือบทั้งหมด',
  },
  {
    maxAge: 20.30228,
    name: 'Waning Gibbous',
    thaiName: 'ข้างแรมเกือบเต็มดวง',
    tone: 'แสงเต็มดวงกำลังค่อยๆ เบาลง',
  },
  {
    maxAge: 23.99361,
    name: 'Last Quarter',
    thaiName: 'ข้างแรมครึ่งดวง',
    tone: 'ครึ่งหนึ่งของแสงกำลังพัก',
  },
  {
    maxAge: 27.68493,
    name: 'Waning Crescent',
    thaiName: 'ข้างแรมเสี้ยวบาง',
    tone: 'พระจันทร์เหลือแสงไว้เพียงบางส่วน',
  },
  {
    maxAge: LUNAR_CYCLE_DAYS,
    name: 'New Moon',
    thaiName: 'เดือนดับ',
    tone: 'พระจันทร์กำลังกลับไปเริ่มรอบใหม่',
  },
];

function getPhaseByAge(age) {
  return PHASES.find((phase) => age < phase.maxAge) || PHASES[PHASES.length - 1];
}

function getNextFullMoonDate(age, date) {
  const fullMoonAge = LUNAR_CYCLE_DAYS / 2;
  const daysUntilFull = age <= fullMoonAge
    ? fullMoonAge - age
    : LUNAR_CYCLE_DAYS - age + fullMoonAge;

  return new Date(date.getTime() + daysUntilFull * DAY_MS);
}

function formatThaiDate(date) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function getMoonPhase(date = new Date()) {
  const daysSinceKnownNewMoon = (date.getTime() - KNOWN_NEW_MOON_UTC) / DAY_MS;
  const normalizedAge = ((daysSinceKnownNewMoon % LUNAR_CYCLE_DAYS) + LUNAR_CYCLE_DAYS) % LUNAR_CYCLE_DAYS;
  const phase = getPhaseByAge(normalizedAge);
  const illumination = Math.round(((1 - Math.cos((2 * Math.PI * normalizedAge) / LUNAR_CYCLE_DAYS)) / 2) * 100);
  const nextFullMoon = getNextFullMoonDate(normalizedAge, date);
  const daysUntilFullMoon = Math.max(0, Math.ceil((nextFullMoon.getTime() - date.getTime()) / DAY_MS));

  return {
    ...phase,
    age: normalizedAge,
    ageText: `${normalizedAge.toFixed(1)} วัน`,
    illumination,
    illuminationText: `สว่าง ${illumination}%`,
    nextFullMoonText: daysUntilFullMoon === 0
      ? 'คืนนี้ใกล้เต็มดวงที่สุด'
      : `อีก ${daysUntilFullMoon} วันถึงเต็มดวง`,
    nextFullMoonDateText: formatThaiDate(nextFullMoon),
  };
}
