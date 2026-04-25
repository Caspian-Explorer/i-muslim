import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";
import rehypeStringify from "rehype-stringify";

const ALLOWED_IMG_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "images.unsplash.com",
  "upload.wikimedia.org",
]);

const schema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      "src",
      "alt",
      "title",
      ["loading", "lazy", "eager"],
      ["decoding", "async", "sync", "auto"],
    ],
    a: [
      "href",
      "title",
      ["rel", "noopener", "noreferrer", "nofollow"],
      ["target", "_blank"],
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    src: ["https"],
    href: ["http", "https", "mailto"],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "figure",
    "figcaption",
  ],
};

export interface RenderOptions {
  dir?: "ltr" | "rtl";
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

function isAllowedImgSrc(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_IMG_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function postProcessHtml(html: string): string {
  return html.replace(
    /<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi,
    (match, src: string) => (isAllowedImgSrc(src) ? match : ""),
  );
}

export async function renderMarkdown(
  markdown: string,
  options: RenderOptions = {},
): Promise<string> {
  const file = await processor.process(markdown ?? "");
  const html = postProcessHtml(String(file));
  const dir = options.dir ?? "ltr";
  return `<div class="article-prose" dir="${dir}">${html}</div>`;
}
