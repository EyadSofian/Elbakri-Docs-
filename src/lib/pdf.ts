// PDF export using html2canvas-pro (supports oklch/lab) + jsPDF.
import { toast } from "sonner";

export type PdfOrientation = "portrait" | "landscape";

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((res) => {
        img.addEventListener("load", () => res(), { once: true });
        img.addEventListener("error", () => res(), { once: true });
      });
    }),
  );
}

function getAvoidBreakIntervals(root: HTMLElement, canvas: HTMLCanvasElement) {
  const rootRect = root.getBoundingClientRect();
  if (!rootRect.height) return [];
  const scaleY = canvas.height / rootRect.height;
  const selectors = "tr, li, footer, .pdf-avoid-break";

  return Array.from(root.querySelectorAll<HTMLElement>(selectors))
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: Math.max(0, (rect.top - rootRect.top) * scaleY),
        bottom: Math.min(canvas.height, (rect.bottom - rootRect.top) * scaleY),
      };
    })
    .filter((interval) => interval.bottom - interval.top > 2)
    .sort((a, b) => a.top - b.top);
}

function choosePageCut(
  startY: number,
  targetY: number,
  totalHeight: number,
  pageHeight: number,
  avoidIntervals: Array<{ top: number; bottom: number }>,
) {
  let cutY = Math.min(targetY, totalHeight);
  const minUsefulPage = pageHeight * 0.35;

  for (const interval of avoidIntervals) {
    if (interval.top <= startY + 1) continue;
    if (interval.top < cutY && cutY < interval.bottom) {
      const candidate = interval.top;
      if (candidate - startY >= minUsefulPage) {
        cutY = candidate;
      }
      break;
    }
  }

  return Math.max(startY + 1, Math.min(cutY, totalHeight));
}

export async function exportElementToPdf(
  element: HTMLElement,
  filename: string,
  orientation: PdfOrientation = "portrait",
) {
  if (typeof window === "undefined") return;
  const safe = filename.replace(/[^\w.-]+/g, "_") + (filename.endsWith(".pdf") ? "" : ".pdf");
  const id = toast.loading("Generating PDF…");
  try {
    await waitForImages(element);
    await new Promise((r) => setTimeout(r, 80));

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas-pro"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const avoidBreakIntervals = getAvoidBreakIntervals(element, canvas);

    if (imgH <= pageH) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    } else {
      // Paginate by slicing the rendered canvas vertically.
      const pxPerMm = canvas.width / imgW;
      const pageHpx = pageH * pxPerMm;
      let y = 0;
      while (y < canvas.height) {
        const cutY = choosePageCut(y, y + pageHpx, canvas.height, pageHpx, avoidBreakIntervals);
        const sliceH = Math.min(cutY - y, canvas.height - y);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const sliceData = slice.toDataURL("image/jpeg", 0.95);
        const sliceMmH = sliceH / pxPerMm;
        if (y > 0) pdf.addPage("a4", orientation);
        pdf.addImage(sliceData, "JPEG", 0, 0, imgW, sliceMmH);
        y += sliceH;
      }
    }

    pdf.save(safe);
    toast.success("PDF downloaded", { id });
  } catch (e: any) {
    console.error(e);
    toast.error("PDF export failed: " + (e?.message || "unknown error"), { id });
  }
}

export function printElement(element: HTMLElement) {
  const cls = "print-area";
  element.classList.add(cls);
  const cleanup = () => element.classList.remove(cls);
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
}

export function sanitizeFilenamePart(s: string) {
  return (s || "").replace(/[^\w-]+/g, "_").slice(0, 60) || "doc";
}
