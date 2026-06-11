import moonFull from './1.jpg';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const STORY_TEXT_TOP = 1148;
const STORY_TEXT_BOTTOM = 1594;

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

function trimLineToWidth(context, line, maxWidth) {
  let nextLine = line;

  while (nextLine.length > 1 && context.measureText(`${nextLine}...`).width > maxWidth) {
    nextLine = nextLine.slice(0, -1);
  }

  return `${nextLine}...`;
}

function getWrappedLines(context, text, maxWidth, maxLines = 4) {
  const segments = Array.from(text);
  const lines = [];
  let line = '';

  segments.forEach((segment) => {
    const testLine = line + segment;

    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = segment;
      return;
    }

    line = testLine;
  });

  if (line) {
    lines.push(line);
  }

  const visibleLines = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    visibleLines[maxLines - 1] = trimLineToWidth(context, visibleLines[maxLines - 1], maxWidth);
  }

  return visibleLines;
}

function getStoryTextLayout(context, message) {
  const options = [
    { fontSize: 46, lineHeight: 66, maxLines: 4, maxWidth: 780 },
    { fontSize: 42, lineHeight: 60, maxLines: 4, maxWidth: 780 },
    { fontSize: 38, lineHeight: 56, maxLines: 5, maxWidth: 780 },
    { fontSize: 34, lineHeight: 52, maxLines: 5, maxWidth: 760 },
  ];
  const safeHeight = STORY_TEXT_BOTTOM - STORY_TEXT_TOP;

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    const moodHeight = 34;
    const moodGap = option.fontSize > 40 ? 42 : 34;
    const subtitleGap = option.fontSize > 40 ? 38 : 30;
    const subtitleHeight = 32;

    context.font = `700 ${option.fontSize}px Segoe UI, sans-serif`;
    const lines = getWrappedLines(context, `"${message}"`, option.maxWidth, option.maxLines);
    const messageHeight = lines.length * option.lineHeight;
    const blockHeight = moodHeight + moodGap + messageHeight + subtitleGap + subtitleHeight;

    if (blockHeight <= safeHeight || index === options.length - 1) {
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

function drawCenteredStoryText(context, mark) {
  const centerX = STORY_WIDTH / 2;
  const layout = getStoryTextLayout(context, mark.message);
  const blockTop = STORY_TEXT_TOP + (STORY_TEXT_BOTTOM - STORY_TEXT_TOP - layout.blockHeight) / 2;
  const moodY = blockTop + layout.moodHeight / 2;
  const messageTop = blockTop + layout.moodHeight + layout.moodGap;
  const subtitleY = messageTop + layout.lines.length * layout.lineHeight + layout.subtitleGap + layout.subtitleHeight / 2;

  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.fillStyle = mark.mood.color;
  context.font = '700 28px Segoe UI, sans-serif';
  context.fillText(mark.mood.label, centerX, moodY);

  context.fillStyle = '#f8f4ea';
  context.font = `700 ${layout.fontSize}px Segoe UI, sans-serif`;
  layout.lines.forEach((line, index) => {
    context.fillText(line, centerX, messageTop + index * layout.lineHeight + layout.lineHeight / 2);
  });

  context.fillStyle = '#aaa397';
  context.font = '26px Segoe UI, sans-serif';
  context.fillText('ฝากแสงไว้บนพระจันทร์ดวงเดียวกัน', centerX, subtitleY);
  context.restore();
}

function drawCircleImage(context, image, x, y, size) {
  const cropSize = Math.min(image.width, image.height) * 0.66;
  const cropX = (image.width - cropSize) / 2;
  const cropY = (image.height - cropSize) / 2;

  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, cropX, cropY, cropSize, cropSize, x, y, size, size);

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

export async function createStoryBlob(mark) {
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const context = canvas.getContext('2d');
  const image = await loadImage(moonFull);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  const background = context.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  background.addColorStop(0, '#020202');
  background.addColorStop(0.46, '#090909');
  background.addColorStop(1, '#000000');
  context.fillStyle = background;
  context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  getStableStars(mark.id, 150).forEach((star) => {
    context.fillStyle = `rgba(255,255,255,${star.alpha})`;
    context.fillRect(star.x, star.y, star.size, star.size);
  });

  const moonSize = 840;
  const moonX = (STORY_WIDTH - moonSize) / 2;
  const moonY = 250;

  const moonGlow = context.createRadialGradient(
    STORY_WIDTH / 2,
    moonY + moonSize / 2,
    moonSize * 0.28,
    STORY_WIDTH / 2,
    moonY + moonSize / 2,
    moonSize * 0.72
  );
  moonGlow.addColorStop(0, 'rgba(255,255,255,0.18)');
  moonGlow.addColorStop(0.48, 'rgba(188,216,255,0.08)');
  moonGlow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = moonGlow;
  context.beginPath();
  context.arc(STORY_WIDTH / 2, moonY + moonSize / 2, moonSize * 0.72, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(255,255,255,0.16)';
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(STORY_WIDTH / 2, moonY + moonSize / 2, 500, 250, -0.22, 0, Math.PI * 2);
  context.stroke();

  drawCircleImage(context, image, moonX, moonY, moonSize);
  drawLightMark(context, mark, moonX, moonY, moonSize);

  context.textAlign = 'left';
  context.fillStyle = '#f8f4ea';
  context.font = '700 30px Segoe UI, sans-serif';
  context.fillText('LEAVE A LIGHT', 96, 118);

  context.textAlign = 'right';
  context.fillStyle = '#bdb7aa';
  context.font = '26px Segoe UI, sans-serif';
  context.fillText('@t__n_f__ling', STORY_WIDTH - 96, 118);

  drawCenteredStoryText(context, mark);

  context.strokeStyle = 'rgba(255,255,255,0.16)';
  context.beginPath();
  context.moveTo(96, 1685);
  context.lineTo(STORY_WIDTH - 96, 1685);
  context.stroke();

  context.textAlign = 'left';
  context.fillStyle = '#f8f4ea';
  context.font = '30px Segoe UI, sans-serif';
  context.fillText('same moon, different light', 96, 1746);

  context.fillStyle = '#aaa397';
  context.font = '24px Segoe UI, sans-serif';
  context.fillText('share your own light at t__n_f__ling', 96, 1790);

  context.textAlign = 'right';
  context.fillStyle = '#d8d2c5';
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
