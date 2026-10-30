import qrcode from 'qrcode-generator';

/**
 * Generate a base64 Data URL for a QR code using 100% pure JS without CommonJS require dependencies.
 */
export function generateQrDataUrl(text: string): string {
  if (!text) return '';
  try {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(5, 4);
  } catch (err) {
    try {
      // Fallback with lower error correction if payload is long
      const qr = qrcode(0, 'L');
      qr.addData(text);
      qr.make();
      return qr.createDataURL(4, 4);
    } catch (fallbackErr) {
      console.error('Failed to generate QR code data URL:', fallbackErr);
      return '';
    }
  }
}
