// Client-side high-resolution PDF generator for official letters
// Precision A4 (210mm x 297mm) ISO 216 layout with 300 DPI razor-sharp print quality

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ApplicantData } from '../types';

export interface GeneratePdfOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
  paperSize?: 'a4' | 'f4';
}

export interface PrintDocumentOptions {
  paperSize?: 'a4' | 'f4';
  title?: string;
}

// Global cached canvas for high-performance color conversion
let colorCanvasCtx: CanvasRenderingContext2D | null = null;

function convertOklabToRgb(colorStr: string): string {
  if (!colorStr || (!colorStr.includes('oklab') && !colorStr.includes('oklch'))) {
    return colorStr;
  }
  try {
    if (!colorCanvasCtx && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 1;
      c.height = 1;
      colorCanvasCtx = c.getContext('2d');
    }
    if (colorCanvasCtx) {
      colorCanvasCtx.fillStyle = '#0f172a';
      colorCanvasCtx.fillStyle = colorStr;
      const converted = colorCanvasCtx.fillStyle;
      if (converted && !converted.includes('oklab') && !converted.includes('oklch')) {
        return converted;
      }
    }
  } catch {
    // fallback
  }
  return '#0f172a';
}

function createComputedStyleProxy(origFn: typeof window.getComputedStyle) {
  return function (el: Element, pseudo?: string | null): CSSStyleDeclaration {
    const style = origFn.call(window, el, pseudo);
    return new Proxy(style, {
      get(target, prop) {
        let value: any;
        try {
          // Access target[prop] directly without passing receiver
          // to avoid "TypeError: Illegal invocation" on native DOM accessors
          value = (target as any)[prop];
        } catch {
          return undefined;
        }

        if (typeof value === 'function') {
          if (prop === 'getPropertyValue') {
            return function (propName: string) {
              const raw = target.getPropertyValue(propName);
              if (raw && (raw.includes('oklab') || raw.includes('oklch'))) {
                return convertOklabToRgb(raw);
              }
              return raw;
            };
          }
          return value.bind(target);
        }

        if (typeof value === 'string' && (value.includes('oklab') || value.includes('oklch'))) {
          return convertOklabToRgb(value);
        }
        return value;
      },
    });
  };
}

export async function generateOfficialLetterPdf(
  elementId: string,
  data: ApplicantData,
  options?: GeneratePdfOptions
): Promise<void> {
  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`Elemen dokumen #${elementId} tidak ditemukan.`);
  }

  const isF4 = options?.paperSize === 'f4';
  const pdfWidthMm = isF4 ? 215 : 210;
  const pdfHeightMm = isF4 ? 330 : 297;
  const sandboxWidthPx = isF4 ? 813 : 794;
  const sandboxHeightPx = isF4 ? 1247 : 1123;

  // Find all individual pages (.official-letter-page)
  let pages = Array.from(container.querySelectorAll<HTMLElement>('.official-letter-page'));
  if (pages.length === 0) {
    pages = [container];
  }

  // Sanitize filename
  const cleanNumber = (data.nomorSurat || 'Surat').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanName = (data.namaLengkap || 'Pemohon').replace(/[^a-zA-Z0-9_-]/g, '_');
  const sizeSuffix = isF4 ? 'F4_Folio' : 'A4';
  const filename = options?.filename || `${cleanNumber}_${cleanName}_${sizeSuffix}.pdf`;

  // Intercept window.getComputedStyle during generation
  const origGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = createComputedStyleProxy(origGetComputedStyle);

  // Initialize jsPDF with standard International A4 (210x297mm) or Indonesian F4 / Folio (215x330mm)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isF4 ? [215, 330] : 'a4',
    compress: true,
  });

  try {
    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];

      // Create an exact off-screen rendering sandbox matching target paper dimensions
      const renderSandbox = document.createElement('div');
      renderSandbox.style.position = 'fixed';
      renderSandbox.style.left = '-10000px';
      renderSandbox.style.top = '0';
      renderSandbox.style.width = `${sandboxWidthPx}px`;
      renderSandbox.style.height = `${sandboxHeightPx}px`;
      renderSandbox.style.maxWidth = `${sandboxWidthPx}px`;
      renderSandbox.style.minWidth = `${sandboxWidthPx}px`;
      renderSandbox.style.maxHeight = `${sandboxHeightPx}px`;
      renderSandbox.style.minHeight = `${sandboxHeightPx}px`;
      renderSandbox.style.padding = '0';
      renderSandbox.style.margin = '0';
      renderSandbox.style.backgroundColor = '#ffffff';
      renderSandbox.style.overflow = 'visible';
      renderSandbox.style.zIndex = '-99999';

      // Clone page element into sandbox with strict paper dimensions
      const pageClone = pageEl.cloneNode(true) as HTMLElement;
      pageClone.style.width = `${sandboxWidthPx}px`;
      pageClone.style.maxWidth = `${sandboxWidthPx}px`;
      pageClone.style.minWidth = `${sandboxWidthPx}px`;
      pageClone.style.height = `${sandboxHeightPx}px`;
      pageClone.style.maxHeight = `${sandboxHeightPx}px`;
      pageClone.style.minHeight = `${sandboxHeightPx}px`;
      pageClone.style.boxSizing = 'border-box';
      pageClone.style.padding = '2.0cm 2.5cm 2.0cm 2.5cm';
      pageClone.style.margin = '0';
      pageClone.style.border = 'none';
      pageClone.style.boxShadow = 'none';
      pageClone.style.backgroundColor = '#ffffff';
      pageClone.style.color = '#0f172a';
      pageClone.style.fontFamily = '"Times New Roman", Times, "Liberation Serif", serif';
      pageClone.style.overflow = 'visible';

      // Cleanly replace any interactive inline input fields with pure text spans
      pageClone.querySelectorAll<HTMLElement>('.doc-inline-input').forEach((input) => {
        const val = (input as HTMLInputElement).value || '';
        const span = document.createElement('span');
        span.textContent = val;
        span.style.fontFamily = 'inherit';
        span.style.fontSize = 'inherit';
        span.style.fontWeight = 'inherit';
        span.style.color = 'inherit';
        input.parentNode?.replaceChild(span, input);
      });

      // Ensure no text hyphenation cuts words awkwardly and preserve explicit colors
      const allTextElements = pageClone.querySelectorAll<HTMLElement>('*');
      allTextElements.forEach((el) => {
        el.style.hyphens = 'none';
        (el.style as any).webkitHyphens = 'none';
        el.style.wordBreak = 'normal';
        el.style.overflowWrap = 'normal';
      });

      // Explicitly color the specific tagline and link classes
      pageClone.querySelectorAll<HTMLElement>('.text-kop-tagline').forEach((el) => {
        el.style.color = '#0d5526';
      });
      pageClone.querySelectorAll<HTMLElement>('.text-kop-link').forEach((el) => {
        el.style.color = '#1d4ed8';
        el.style.textDecoration = 'underline';
      });

      // Remove any preview borders or shadows from clone
      pageClone.classList.remove('border', 'border-slate-300', 'shadow-sm', 'shadow-md', 'rounded-2xl', 'rounded-xl', 'rounded-lg');

      renderSandbox.appendChild(pageClone);
      document.body.appendChild(renderSandbox);

      // Render high-res canvas at scale: 2 (300 DPI razor-sharp print quality)
      const canvas = await html2canvas(pageClone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: sandboxWidthPx,
        height: sandboxHeightPx,
        windowWidth: sandboxWidthPx,
        windowHeight: sandboxHeightPx,
        onclone: (clonedDoc) => {
          if (clonedDoc.defaultView) {
            clonedDoc.defaultView.getComputedStyle = createComputedStyleProxy(
              clonedDoc.defaultView.getComputedStyle
            );
          }

          // Reinforce colors on cloned document
          clonedDoc.querySelectorAll<HTMLElement>('.text-kop-tagline').forEach((el) => {
            el.style.color = '#0d5526';
          });
          clonedDoc.querySelectorAll<HTMLElement>('.text-kop-link').forEach((el) => {
            el.style.color = '#1d4ed8';
            el.style.textDecoration = 'underline';
          });

          // Sanitize any remaining oklab/oklch colors in stylesheets
          try {
            const styleTags = clonedDoc.querySelectorAll('style');
            styleTags.forEach((tag) => {
              if (tag.textContent && (tag.textContent.includes('oklab') || tag.textContent.includes('oklch'))) {
                tag.textContent = tag.textContent
                  .replace(/oklab\([^)]+\)/gi, '#0f172a')
                  .replace(/oklch\([^)]+\)/gi, '#0f172a');
              }
            });
          } catch {
            // ignore
          }
        },
      });

      // Cleanup sandbox from document body
      if (document.body.contains(renderSandbox)) {
        document.body.removeChild(renderSandbox);
      }

      // Add page to PDF
      if (i > 0) {
        pdf.addPage(isF4 ? [215, 330] : 'a4', 'portrait');
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm, undefined, 'FAST');
    }

    // Trigger download reliably via Blob URL
    const pdfBlob = pdf.output('blob');
    if (pdfBlob && pdfBlob.size > 0) {
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(blobUrl);
        } catch {
          // ignore
        }
      }, 2000);
    } else {
      // Direct save fallback
      pdf.save(filename);
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    window.getComputedStyle = origGetComputedStyle;
  }
}

/**
 * Bulletproof print function that works across desktop, mobile, and iframe environments
 * Creates a clean isolated print context with exact A4/F4 page dimensions
 */
export async function printOfficialDocument(
  elementId: string,
  options?: PrintDocumentOptions
): Promise<{ success: boolean; method: 'iframe' | 'native' | 'fallback'; reason?: string }> {
  const container = document.getElementById(elementId);
  if (!container) {
    console.warn(`Elemen #${elementId} tidak ditemukan untuk dicetak.`);
    try {
      window.print();
      return { success: true, method: 'native' };
    } catch {
      return { success: false, method: 'fallback', reason: 'element_not_found' };
    }
  }

  const isF4 = options?.paperSize === 'f4';
  const paperLabel = isF4 ? '215mm 330mm' : 'A4 portrait';

  try {
    // Remove any previous temporary print iframe
    const prevFrame = document.getElementById('__official_letter_print_iframe__');
    if (prevFrame && prevFrame.parentNode) {
      prevFrame.parentNode.removeChild(prevFrame);
    }

    // Create a real renderable iframe (NOT visibility:hidden or 0x0 which modern Chrome ignores for print)
    const printFrame = document.createElement('iframe');
    printFrame.id = '__official_letter_print_iframe__';
    printFrame.style.position = 'fixed';
    printFrame.style.left = '0';
    printFrame.style.top = '0';
    printFrame.style.width = '100vw';
    printFrame.style.height = '100vh';
    printFrame.style.border = 'none';
    printFrame.style.opacity = '0.001';
    printFrame.style.pointerEvents = 'none';
    printFrame.style.zIndex = '-99999';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      // Extract pages or container content
      const pages = container.querySelectorAll<HTMLElement>('.official-letter-page');
      let pagesHtml = '';
      if (pages.length > 0) {
        pages.forEach((p) => {
          const clone = p.cloneNode(true) as HTMLElement;
          clone.classList.remove('border', 'border-slate-300', 'shadow-sm', 'shadow-md', 'rounded-lg', 'rounded-2xl', 'rounded-xl');
          
          // Replace any inline input fields with clean formal text
          clone.querySelectorAll<HTMLElement>('.doc-inline-input').forEach((input) => {
            const val = (input as HTMLInputElement).value || '';
            const span = document.createElement('span');
            span.textContent = val;
            span.style.fontFamily = 'inherit';
            span.style.fontSize = 'inherit';
            span.style.fontWeight = 'inherit';
            span.style.color = 'inherit';
            input.parentNode?.replaceChild(span, input);
          });

          pagesHtml += clone.outerHTML;
        });
      } else {
        pagesHtml = container.innerHTML;
      }

      // Collect all active stylesheets and font declarations
      let stylesHtml = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach((s) => {
        stylesHtml += s.outerHTML;
      });

      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="utf-8">
          <title>${options?.title || 'Cetak Surat Resmi PT Alzam Mandiri Wisata'}</title>
          ${stylesHtml}
          <style>
            @page {
              size: ${paperLabel};
              margin: 2.0cm 2.5cm 2.0cm 2.5cm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: "Times New Roman", Times, "Liberation Serif", serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .official-letter-page {
              box-sizing: border-box !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            .official-letter-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .text-kop-tagline {
              color: #0d5526 !important;
            }
            .text-kop-link {
              color: #1d4ed8 !important;
              text-decoration: underline !important;
            }
            input, textarea, button, .print\\:hidden, .print-hidden {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
        </html>
      `);
      frameDoc.close();

      // Wait for all images to settle
      const imgs = Array.from(frameDoc.images);
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(resolve, 800);
          });
        })
      );

      // Brief rendering pause
      await new Promise((r) => setTimeout(r, 200));

      if (printFrame.contentWindow) {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();

          // Auto cleanup iframe after printing
          const cleanup = () => {
            try {
              if (printFrame.parentNode) {
                printFrame.parentNode.removeChild(printFrame);
              }
            } catch {
              // ignore
            }
          };
          printFrame.contentWindow.addEventListener('afterprint', cleanup);
          setTimeout(cleanup, 60000);

          return { success: true, method: 'iframe' };
        } catch (printInvokeErr) {
          console.warn('Iframe print invoke failed or was blocked by sandbox:', printInvokeErr);
          // Fall through to native attempt
        }
      }
    }
  } catch (frameErr) {
    console.warn('Iframe printing setup failed, attempting standard window.print():', frameErr);
  }

  // Fallback to native window.print()
  try {
    window.print();
    return { success: true, method: 'native' };
  } catch (winErr) {
    console.warn('Native window.print() failed:', winErr);
    return { success: false, method: 'fallback', reason: 'blocked_by_sandbox' };
  }
}

/**
 * Backward compatibility alias
 */
export function printLetterDocument(): void {
  printOfficialDocument('official-letter-to-print');
}
