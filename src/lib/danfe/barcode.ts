/**
 * Generates a Code 128B barcode as a canvas data URL.
 * Used for the NF-e access key barcode in DANFE.
 */

const CODE128B_START = 104;
const CODE128_STOP = 106;

const CODE128_PATTERNS: number[] = [
  0x6CC, 0x66C, 0x666, 0x498, 0x48C, 0x44C, 0x4C8, 0x4C4, 0x468, 0x464,
  0x648, 0x644, 0x6C4, 0x4E8, 0x4E4, 0x4CE, 0x5E8, 0x5E4, 0x5CE, 0x768,
  0x764, 0x734, 0x6B4, 0x6BA, 0x5B4, 0x5BA, 0x59A, 0x56A, 0x4DA, 0x4AE,
  0x5AC, 0x5A6, 0x4B6, 0x636, 0x63A, 0x61A, 0x698, 0x694, 0x6D4, 0x6B2,
  0x6D2, 0x5B2, 0x5BA, 0x596, 0x5DA, 0x58E, 0x4BC, 0x4B8, 0x47C, 0x638,
  0x634, 0x618, 0x614, 0x67C, 0x478, 0x474, 0x658, 0x654, 0x674, 0x578,
  0x574, 0x558, 0x554, 0x57C, 0x6DC, 0x6D8, 0x6EC, 0x5DC, 0x5D8, 0x5EC,
  0x59C, 0x598, 0x5BC, 0x4DC, 0x4D8, 0x4EC, 0x49C, 0x498, 0x4BC, 0x5DE,
  0x4DE, 0x6E6, 0x6E2, 0x6EE, 0x5E6, 0x5E2, 0x5EE, 0x59E, 0x592, 0x5BE,
  0x4CE, 0x4CA, 0x4D6, 0x4AE, 0x4AA, 0x4B6, 0x572, 0x536, 0x53A, 0x576,
  0x57A, 0x73A, 0x6B6, 0x6BA, 0x5B6, 0x5BA, 0x6CC, 0x68C,
];

export function generateBarcodeDataUrl(text: string, height: number = 50): string {
  // Encode using Code 128B
  const values: number[] = [CODE128B_START];
  let checksum = CODE128B_START;

  for (let i = 0; i < text.length; i++) {
    const val = text.charCodeAt(i) - 32;
    values.push(val);
    checksum += val * (i + 1);
  }

  values.push(checksum % 103);
  values.push(CODE128_STOP);

  // Build binary string
  let binary = "";
  for (const val of values) {
    const pattern = CODE128_PATTERNS[val];
    if (pattern === undefined) continue;
    for (let bit = 10; bit >= 0; bit--) {
      binary += (pattern >> bit) & 1 ? "1" : "0";
    }
  }
  // Stop pattern has extra bar
  binary += "11";

  // Draw on canvas
  const barWidth = 1;
  const canvas = document.createElement("canvas");
  canvas.width = binary.length * barWidth;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === "1") {
      ctx.fillRect(i * barWidth, 0, barWidth, height);
    }
  }

  return canvas.toDataURL("image/png");
}

/**
 * Simple numeric-only barcode using interleaved 2 of 5 (ITF)
 * which is the standard for NF-e access keys (44 digits).
 */
const ITF_PATTERNS: Record<string, string> = {
  "0": "NNWWN", "1": "WNNNW", "2": "NWNNW", "3": "WWNNN",
  "4": "NNWNW", "5": "WNWNN", "6": "NWWNN", "7": "NNNWW",
  "8": "WNNWN", "9": "NWNWN",
};

export function generateITFBarcodeDataUrl(digits: string, height: number = 50): string {
  // ITF requires even number of digits
  let d = digits.replace(/\D/g, "");
  if (d.length % 2 !== 0) d = "0" + d;

  const bars: boolean[] = [];

  // Start pattern: NNNN
  bars.push(false, true, false, true);

  for (let i = 0; i < d.length; i += 2) {
    const patBars = ITF_PATTERNS[d[i]];
    const patSpaces = ITF_PATTERNS[d[i + 1]];

    for (let j = 0; j < 5; j++) {
      const barWide = patBars[j] === "W";
      const spaceWide = patSpaces[j] === "W";

      // Bar
      const barCount = barWide ? 3 : 1;
      for (let k = 0; k < barCount; k++) bars.push(true);

      // Space
      const spaceCount = spaceWide ? 3 : 1;
      for (let k = 0; k < spaceCount; k++) bars.push(false);
    }
  }

  // Stop pattern: WNN
  bars.push(true, true, true, false, true);

  const barWidth = 1;
  const canvas = document.createElement("canvas");
  canvas.width = bars.length * barWidth;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#000000";
  for (let i = 0; i < bars.length; i++) {
    if (bars[i]) {
      ctx.fillRect(i * barWidth, 0, barWidth, height);
    }
  }

  return canvas.toDataURL("image/png");
}
