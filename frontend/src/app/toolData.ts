export type Tool = {
  title: string;
  description: string;
  href: string;
};

export const tools: Tool[] = [
  {
    title: "Merge PDFs",
    description: "Combine two or more PDFs into one ordered document.",
    href: "/merge",
  },
  {
    title: "Split PDF",
    description: "Extract specific pages or ranges into a new PDF.",
    href: "/split",
  },
  {
    title: "Remove Pages",
    description: "Remove selected pages and keep the remaining document.",
    href: "/remove-pages",
  },
  {
    title: "Rotate PDF",
    description: "Rotate every page or only selected page ranges.",
    href: "/rotate",
  },
  {
    title: "Image to PDF",
    description: "Turn one or more images into a single PDF.",
    href: "/image-to-pdf",
  },
  {
    title: "PDF to Image",
    description: "Export PDF pages as PNG or JPEG images.",
    href: "/pdf-to-image",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF size with selectable compression levels.",
    href: "/compress",
  },
];
