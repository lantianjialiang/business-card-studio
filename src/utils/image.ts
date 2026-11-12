export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('无法读取图片，请检查文件是否损坏。'));
    image.src = src;
  });
}

function blackWhiteThreshold(histogram: Uint32Array, count: number, total: number) {
  let darkCount = 0;
  let darkTotal = 0;
  let bestScore = 0;
  let threshold = 127;
  for (let tone = 0; tone < histogram.length; tone++) {
    darkCount += histogram[tone];
    darkTotal += tone * histogram[tone];
    const lightCount = count - darkCount;
    if (!darkCount || !lightCount) continue;
    // Split the histogram where the dark and light groups differ most.
    const difference = darkTotal / darkCount - (total - darkTotal) / lightCount;
    const score = darkCount * lightCount * difference ** 2;
    if (score > bestScore) {
      bestScore = score;
      threshold = tone;
    }
  }
  return threshold;
}

export function monochromeImage(image: HTMLImageElement, binary: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = pixels;
  const histogram = binary ? new Uint32Array(256) : undefined;
  let count = 0;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const tone = Math.round(data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
    data[i] = data[i + 1] = data[i + 2] = tone;
    if (histogram && data[i + 3] > 0) {
      histogram[tone]++;
      count++;
      total += tone;
    }
  }
  if (histogram) {
    const threshold = blackWhiteThreshold(histogram, count, total);
    for (let i = 0; i < data.length; i += 4) {
      const tone = data[i] <= threshold ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = tone;
    }
  }
  context.putImageData(pixels, 0, 0);
  return canvas;
}

export async function readImage(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('图片不能超过 10 MB。');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('请选择 JPG、PNG 或 WebP 图片。');
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp', 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace(/[<>:"/\\|?*]/g, '-');
  document.body.append(link);
  link.click();
  link.remove();
}
