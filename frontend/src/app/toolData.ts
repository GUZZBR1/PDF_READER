export type Tool = {
  title: string;
  description: string;
  href: string;
};

export const tools: Tool[] = [
  {
    title: "Merge PDFs",
    description: "Combine multiple PDF files into one ordered document.",
    href: "/merge",
  },
  {
    title: "Split PDF",
    description: "Extract selected pages into a separate PDF file.",
    href: "/split",
  },
  {
    title: "Remove Pages",
    description: "Delete unwanted pages while keeping the rest of the document.",
    href: "/remove-pages",
  },
  {
    title: "Rotate PDF",
    description: "Rotate all pages or selected page ranges.",
    href: "/rotate",
  },
  {
    title: "Image to PDF",
    description: "Turn one or more images into a single PDF.",
    href: "/image-to-pdf",
  },
  {
    title: "PDF to Image",
    description: "Export PDF pages as image files.",
    href: "/pdf-to-image",
  },
  {
    title: "Compress PDF",
    description: "Reduce PDF file size for easier storage and sharing.",
    href: "/compress",
  },
];
