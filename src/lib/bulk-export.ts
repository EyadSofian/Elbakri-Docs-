// Bulk invoice export: combined PDF and ZIP.
import { toast } from "sonner";

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

async function renderToCanvas(el: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas-pro");
  await waitForImages(el);
  await new Promise((r) => setTimeout(r, 60));
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
}

function addCanvasToPdf(pdf: any, canvas: HTMLCanvasElement) {
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;

  if (imgH <= pageH) {
    pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    return;
  }
  // paginate
  const pxPerMm = canvas.width / imgW;
  const pageHpx = pageH * pxPerMm;
  let y = 0;
  let first = true;
  while (y < canvas.height) {
    const sliceH = Math.min(pageHpx, canvas.height - y);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    const sliceData = slice.toDataURL("image/jpeg", 0.92);
    const sliceMmH = sliceH / pxPerMm;
    if (!first) pdf.addPage("a4", "portrait");
    pdf.addImage(sliceData, "JPEG", 0, 0, imgW, sliceMmH);
    first = false;
    y += sliceH;
  }
}

export interface BulkSlide {
  element: HTMLElement;
  filename: string; // for ZIP entries (without extension is fine, .pdf appended)
}

export async function exportCombinedPdf(slides: BulkSlide[], filename: string) {
  if (typeof window === "undefined" || slides.length === 0) return;
  const id = toast.loading(`Generating combined PDF (${slides.length} invoices)…`);
  try {
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    let first = true;
    for (let i = 0; i < slides.length; i++) {
      toast.loading(`Rendering ${i + 1} / ${slides.length}…`, { id });
      const canvas = await renderToCanvas(slides[i].element);
      if (!first) pdf.addPage("a4", "portrait");
      addCanvasToPdf(pdf, canvas);
      first = false;
    }
    pdf.save(filename.endsWith(".pdf") ? filename : filename + ".pdf");
    toast.success("Combined PDF downloaded", { id });
  } catch (e: any) {
    console.error(e);
    toast.error("Combined PDF failed: " + (e?.message || "error"), { id });
  }
}

export async function exportZip(slides: BulkSlide[], zipFilename: string) {
  if (typeof window === "undefined" || slides.length === 0) return;
  const id = toast.loading(`Generating ZIP (${slides.length} invoices)…`);
  try {
    const [{ default: JSZip }, { default: jsPDF }, { saveAs }] = await Promise.all([
      import("jszip"),
      import("jspdf"),
      import("file-saver"),
    ]);
    const zip = new JSZip();
    for (let i = 0; i < slides.length; i++) {
      toast.loading(`Rendering ${i + 1} / ${slides.length}…`, { id });
      const canvas = await renderToCanvas(slides[i].element);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      addCanvasToPdf(pdf, canvas);
      const blob = pdf.output("blob");
      const name = (slides[i].filename || `invoice-${i + 1}`).replace(/\.pdf$/i, "") + ".pdf";
      zip.file(name, blob);
    }
    const out = await zip.generateAsync({ type: "blob" });
    saveAs(out, zipFilename.endsWith(".zip") ? zipFilename : zipFilename + ".zip");
    toast.success("ZIP downloaded", { id });
  } catch (e: any) {
    console.error(e);
    toast.error("ZIP export failed: " + (e?.message || "error"), { id });
  }
}

export function bulkFilename(prefix: string, parts: (string | undefined)[]) {
  const safe = parts
    .filter(Boolean)
    .map((p) => String(p).replace(/[^\w-]+/g, "_"))
    .join("-");
  return `${prefix}-${safe}`.slice(0, 120);
}
