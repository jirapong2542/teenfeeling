import moonFull from './1.jpg';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const STORY_TEXT_BOX = {
  x: 150,
  y: 1118,
  width: 780,
  height: 360,
};
const STORY_TEXT_WIDTH = 740;

export const STORY_THEMES = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'พระจันทร์เต็มดวงกับแสงเด่นแบบเดิม',
    background: ['#020202', '#090909', '#000000'],
    moonSize: 840,
    moonY: 250,
    moonGlow: ['rgba(255,255,255,0.18)', 'rgba(188,216,255,0.08)', 'rgba(255,255,255,0)'],
    orbitColor: 'rgba(255,255,255,0.16)',
    starAmount: 150,
    starTone: '255,255,255',
    textColor: '#f8f4ea',
    mutedColor: '#aaa397',
    brandColor: '#f8f4ea',
    footerLine: 'rgba(255,255,255,0.16)',
    footerText: 'same moon, different light',
    cropScale: 0.66,
    imageScale: 1,
    showOrbit: true,
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'ดำนิ่ง โล่ง อ่านข้อความชัด',
    background: ['#000000', '#030303', '#000000'],
    moonSize: 690,
    moonY: 300,
    moonGlow: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.045)', 'rgba(255,255,255,0)'],
    orbitColor: 'rgba(255,255,255,0.08)',
    starAmount: 36,
    starTone: '255,255,255',
    textColor: '#ffffff',
    mutedColor: '#9d9d9d',
    brandColor: '#f8f4ea',
    footerLine: 'rgba(255,255,255,0.1)',
    footerText: 'quiet light, same moon',
    cropScale: 0.68,
    imageScale: 1,
    showOrbit: false,
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'เข้ม ลึก เหมือนโปสเตอร์หนัง',
    background: ['#01030a', '#07101b', '#000000'],
    moonSize: 910,
    moonY: 205,
    moonGlow: ['rgba(188,216,255,0.24)', 'rgba(82,118,166,0.13)', 'rgba(255,255,255,0)'],
    orbitColor: 'rgba(188,216,255,0.2)',
    starAmount: 210,
    starTone: '210,226,255',
    textColor: '#f4f7ff',
    mutedColor: '#9ba8bd',
    brandColor: '#e8f4ff',
    footerLine: 'rgba(188,216,255,0.18)',
    footerText: 'a small signal in the dark',
    cropScale: 0.65,
    imageScale: 1.02,
    showOrbit: true,
  },
  {
    id: 'warm',
    label: 'Warm Light',
    description: 'แสงอุ่น นุ่ม เหมาะกับข้อความคิดถึง',
    background: ['#050403', '#0c0a07', '#000000'],
    moonSize: 800,
    moonY: 260,
    moonGlow: ['rgba(255,231,168,0.2)', 'rgba(255,231,168,0.08)', 'rgba(255,231,168,0)'],
    orbitColor: 'rgba(255,231,168,0.18)',
    starAmount: 110,
    starTone: '255,231,168',
    textColor: '#fff7e5',
    mutedColor: '#b8a98c',
    brandColor: '#fff7e5',
    footerLine: 'rgba(255,231,168,0.17)',
    footerText: 'leave warmth on the moon',
    cropScale: 0.66,
    imageScale: 1,
    showOrbit: true,
  },
];

function getStoryTheme(themeId) {
  return STORY_THEMES.find((theme) => theme.id === themeId) || STORY_THEMES[0];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getStableStars(seed, amount) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 2147483647;
  }

  return Array.from({ length: amount }, (_, index) => {
    hash = (hash * 48271 + index) % 2147483647;

    return {
      x: hash % STORY_WIDTH,
      y: (hash / 2147483647) * STORY_HEIGHT * 0.72,
      alpha: 0.14 + ((hash % 9) / 100),
      size: hash % 7 === 0 ? 2 : 1,
    };
  });
}

function getTextSegments(text, granularity = 'grapheme') {
  if (window.Intl?.Segmenter) {
    return Array.from(new Intl.Segmenter('th', { granularity }).segment(text), (item) => item.segment);
  }

  if (granularity === 'word') {
    return text.split(/(\s+)/).filter(Boolean);
  }

  return Array.from(text);
}

function splitLongSegment(context, segment, maxWidth) {
  if (context.measureText(segment).width <= maxWidth) {
    return [segment];
  }

  const graphemes = getTextSegments(segment, 'grapheme');
  const chunks = [];
  let chunk = '';

  graphemes.forEach((grapheme) => {
    const testChunk = chunk + grapheme;

    if (context.measureText(testChunk).width > maxWidth && chunk) {
      chunks.push(chunk);
      chunk = grapheme;
      return;
    }

    chunk = testChunk;
  });

  if (chunk) {
    chunks.push(chunk);
  }

  return chunks;
}

function trimLineToWidth(context, line, maxWidth) {
  const segments = getTextSegments(line);
  let nextLine = segments.join('');

  while (segments.length > 1 && context.measureText(`${nextLine}...`).width > maxWidth) {
    segments.pop();
    nextLine = segments.join('');
  }

  return `${nextLine}...`;
}

function getWrappedLines(context, text, maxWidth, maxLines = 4) {
  const segments = getTextSegments(text, 'word').flatMap((segment) => splitLongSegment(context, segment, maxWidth));
  const lines = [];
  let line = '';
  let wasClamped = false;

  segments.forEach((segment) => {
    const isWhitespace = segment.trim() === '';
    const testLine = line + segment;

    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line.trim());
      line = isWhitespace ? '' : segment.trimStart();
      return;
    }

    line = testLine;
  });

  if (line.trim()) {
    lines.push(line.trim());
  }

  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    wasClamped = true;
    visibleLines[maxLines - 1] = trimLineToWidth(context, visibleLines[maxLines - 1], maxWidth);
  }

  return {
    lines: visibleLines,
    wasClamped,
  };
}

function getStoryTextLayout(context, message) {
  const options = Array.from({ length: 11 }, (_, index) => {
    const fontSize = 46 - index * 2;

    return {
      fontSize,
      lineHeight: Math.round(fontSize * 1.34),
      maxLines: fontSize >= 38 ? 4 : 5,
      maxWidth: fontSize >= 40 ? STORY_TEXT_WIDTH : STORY_TEXT_BOX.width,
    };
  });
  const safeHeight = STORY_TEXT_BOX.height;

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    const moodHeight = 34;
    const moodGap = option.fontSize > 40 ? 42 : 34;
    const subtitleGap = option.fontSize > 40 ? 38 : 30;
    const subtitleHeight = 32;

    context.font = `700 ${option.fontSize}px Segoe UI, sans-serif`;
    const wrapped = getWrappedLines(context, `"${message}"`, option.maxWidth, option.maxLines);
    const lines = wrapped.lines;
    const messageHeight = lines.length * option.lineHeight;
    const blockHeight = moodHeight + moodGap + messageHeight + subtitleGap + subtitleHeight;

    if ((blockHeight <= safeHeight && !wrapped.wasClamped) || index === options.length - 1) {
      return {
        ...option,
        lines,
        moodHeight,
        moodGap,
        subtitleGap,
        subtitleHeight,
        blockHeight,
      };
    }
  }

  return null;
}

function drawCenteredLine(context, text, centerX, y, maxWidth) {
  const measuredWidth = context.measureText(text).width;
  const drawWidth = Math.min(measuredWidth, maxWidth);
  const drawX = centerX - drawWidth / 2;

  context.save();
  context.textAlign = 'left';
  context.fillText(text, drawX, y, maxWidth);
  context.restore();
}

function drawCenteredStoryText(context, mark, theme) {
  const centerX = STORY_TEXT_BOX.x + STORY_TEXT_BOX.width / 2;
  const layout = getStoryTextLayout(context, mark.message);
  const blockTop = STORY_TEXT_BOX.y + (STORY_TEXT_BOX.height - layout.blockHeight) / 2;
  const moodY = blockTop + layout.moodHeight / 2;
  const messageTop = blockTop + layout.moodHeight + layout.moodGap;
  const subtitleY = messageTop + layout.lines.length * layout.lineHeight + layout.subtitleGap + layout.subtitleHeight / 2;

  context.save();
  context.beginPath();
  context.rect(STORY_TEXT_BOX.x, STORY_TEXT_BOX.y, STORY_TEXT_BOX.width, STORY_TEXT_BOX.height);
  context.clip();
  context.textBaseline = 'middle';

  context.fillStyle = mark.mood.color;
  context.font = '700 28px Segoe UI, sans-serif';
  drawCenteredLine(context, mark.mood.label, centerX, moodY, STORY_TEXT_BOX.width);

  context.fillStyle = theme.textColor;
  context.font = `700 ${layout.fontSize}px Segoe UI, sans-serif`;
  layout.lines.forEach((line, index) => {
    drawCenteredLine(context, line, centerX, messageTop + index * layout.lineHeight + layout.lineHeight / 2, layout.maxWidth);
  });

  context.fillStyle = theme.mutedColor;
  context.font = '26px Segoe UI, sans-serif';
  context.textAlign = 'center';
  context.fillText('ฝากแสงไว้บนพระจันทร์ดวงเดียวกัน', centerX, subtitleY);
  context.restore();
}

function drawCircleImage(context, image, x, y, size, theme) {
  const cropSize = Math.min(image.width, image.height) * theme.cropScale;
  const cropX = (image.width - cropSize) / 2;
  const cropY = (image.height - cropSize) / 2;
  const scaledSize = size * theme.imageScale;
  const imageX = x - (scaledSize - size) / 2;
  const imageY = y - (scaledSize - size) / 2;

  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, cropX, cropY, cropSize, cropSize, imageX, imageY, scaledSize, scaledSize);

  const vignette = context.createRadialGradient(
    x + size / 2,
    y + size / 2,
    size * 0.18,
    x + size / 2,
    y + size / 2,
    size * 0.55
  );
  vignette.addColorStop(0, 'rgba(255,255,255,0)');
  vignette.addColorStop(0.72, 'rgba(0,0,0,0.08)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.48)');
  context.fillStyle = vignette;
  context.fillRect(x, y, size, size);
  context.restore();
}

function drawLightMark(context, mark, moonX, moonY, moonSize) {
  const lightX = moonX + (mark.x / 100) * moonSize;
  const lightY = moonY + (mark.y / 100) * moonSize;

  context.save();
  context.shadowColor = mark.mood.color;
  context.shadowBlur = 48;
  context.fillStyle = mark.mood.color;
  context.beginPath();
  context.arc(lightX, lightY, 13, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = mark.mood.color;
  context.globalAlpha = 0.38;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(lightX, lightY, 31, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

export function getStoryCaption(mark) {
  return `"${mark.message}"\n\nฝากแสงไว้บนพระจันทร์\n@t__n_f__ling`;
}

export async function createStoryBlob(mark, themeId = 'classic') {
  const theme = getStoryTheme(themeId);
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const context = canvas.getContext('2d');
  const image = await loadImage(moonFull);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const background = context.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  background.addColorStop(0, theme.background[0]);
  background.addColorStop(0.46, theme.background[1]);
  background.addColorStop(1, theme.background[2]);
  context.fillStyle = background;
  context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  getStableStars(`${mark.id}-${theme.id}`, theme.starAmount).forEach((star) => {
    context.fillStyle = `rgba(${theme.starTone},${star.alpha})`;
    context.fillRect(star.x, star.y, star.size, star.size);
  });

  const moonSize = theme.moonSize;
  const moonX = (STORY_WIDTH - moonSize) / 2;
  const moonY = theme.moonY;

  const moonGlow = context.createRadialGradient(
    STORY_WIDTH / 2,
    moonY + moonSize / 2,
    moonSize * 0.28,
    STORY_WIDTH / 2,
    moonY + moonSize / 2,
    moonSize * 0.72
  );
  moonGlow.addColorStop(0, theme.moonGlow[0]);
  moonGlow.addColorStop(0.48, theme.moonGlow[1]);
  moonGlow.addColorStop(1, theme.moonGlow[2]);
  context.fillStyle = moonGlow;
  context.beginPath();
  context.arc(STORY_WIDTH / 2, moonY + moonSize / 2, moonSize * 0.72, 0, Math.PI * 2);
  context.fill();

  if (theme.showOrbit) {
    context.strokeStyle = theme.orbitColor;
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(STORY_WIDTH / 2, moonY + moonSize / 2, 500, 250, -0.22, 0, Math.PI * 2);
    context.stroke();
  }

  drawCircleImage(context, image, moonX, moonY, moonSize, theme);
  drawLightMark(context, mark, moonX, moonY, moonSize);

  context.textAlign = 'left';
  context.fillStyle = theme.brandColor;
  context.font = '700 30px Segoe UI, sans-serif';
  context.fillText('LEAVE A LIGHT', 96, 118);

  context.textAlign = 'right';
  context.fillStyle = theme.mutedColor;
  context.font = '26px Segoe UI, sans-serif';
  context.fillText('@t__n_f__ling', STORY_WIDTH - 96, 118);

  drawCenteredStoryText(context, mark, theme);

  context.strokeStyle = theme.footerLine;
  context.beginPath();
  context.moveTo(96, 1685);
  context.lineTo(STORY_WIDTH - 96, 1685);
  context.stroke();

  context.textAlign = 'left';
  context.fillStyle = theme.textColor;
  context.font = '30px Segoe UI, sans-serif';
  context.fillText(theme.footerText, 96, 1746);

  context.fillStyle = theme.mutedColor;
  context.font = '24px Segoe UI, sans-serif';
  context.fillText('share your own light at t__n_f__ling', 96, 1790);

  context.textAlign = 'right';
  context.fillStyle = theme.mutedColor;
  context.font = '24px Segoe UI, sans-serif';
  context.fillText(mark.time, STORY_WIDTH - 96, 1746);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Cannot create story image'));
        return;
      }

      resolve(blob);
    }, 'image/png', 1);
  });
}
