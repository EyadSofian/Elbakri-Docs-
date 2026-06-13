// html2canvas-pro ships without bundled type declarations. This minimal
// ambient module keeps `tsc --noEmit` clean while preserving the call sites
// in src/lib/pdf.ts and src/lib/bulk-export.ts.
declare module "html2canvas-pro" {
  export interface Html2CanvasOptions {
    [key: string]: any;
  }
  const html2canvas: (
    element: HTMLElement,
    options?: Partial<Html2CanvasOptions>,
  ) => Promise<HTMLCanvasElement>;
  export default html2canvas;
}
