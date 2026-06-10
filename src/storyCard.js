import moonFull from './1.jpg';

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

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
    visibleLines[maxLines - 1] = `${visibleLines[maxLines - 1].slice(0, -1)}...`;
  }

  return visibleLines;
}

function drawCenteredStoryText(context, mark) {
  const centerX = STORY_WIDTH / 2;
  const messageLineHeight = 66;
  const moodHeight = 34;
  const moodGap = 46;
  const subtitleGap = 42;
  const subtitleHeight = 32;

  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.font = '700 46px Segoe UI, sans-serif';
  const messageLines = getWrappedLines(context, `"${mark.message}"`, 820, 4);
  const messageHeight = messageLines.length * messageLineHeight;
  const blockHeight = moodHeight + moodGap + messageHeight + subtitleGap + subtitleHeight;
  const blockTop = 1370 - blockHeight / 2;
  const moodY = blockTop + moodHeight / 2;
  const messageTop = blockTop + moodHeight + moodGap;
  const subtitleY = messageTop + messageHeight + subtitleGap + subtitleHeight / 2;

  context.fillStyle = mark.mood.color;
  context.font = '700 28px Segoe UI, sans-serif';
  context.fillText(mark.mood.label, centerX, moodY);

  context.fillStyle = '#f8f4ea';
  context.font = '700 46px Segoe UI, sans-serif';
  messageLines.forEach((line, index) => {
    context.fillText(line, centerX, messageTop + index * messageLineHeight + messageLineHeight / 2);
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
