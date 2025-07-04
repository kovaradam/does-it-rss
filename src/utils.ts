import * as cheerio from "cheerio";
import { err, ok, ResultAsync } from "neverthrow";

export function filterUnique<T>(
  ...[equality]: T extends object ? [(a: T, b: T) => boolean] : []
) {
  return function (item: T, index: number, array: T[]) {
    return array.findIndex((i) => equality?.(i, item) ?? i === item) === index;
  };
}

export function booleanFilter<T>(input?: T | null): input is T {
  return Boolean(input);
}

export function normalizeHref(href: string) {
  if (href.endsWith("/")) {
    return normalizeHref(href.slice(0, -1));
  }
  return href;
}

export function hrefToCompare(href: string) {
  return normalizeHref(href).replace("www.", "");
}

export function enumerate<T extends readonly string[]>(
  input: [...T],
): { [key in T[number]]: key } {
  return Object.fromEntries(input.map((v) => [v, v])) as ReturnType<
    typeof enumerate<T>
  >;
}

export function getDocumentQuery(xmlInput: string) {
  return cheerio.load(
    xmlInput,
    {
      scriptingEnabled: false,
      xml: {
        decodeEntities: false,
      },
    },
    false,
  );
}

export type DocumentQuery = ReturnType<typeof getDocumentQuery>;

export function getIsRssChannel(query: DocumentQuery) {
  return query("feed,rss").length === 1;
}

export async function fetchChannel(url: URL, signal: AbortSignal) {
  const result = await ResultAsync.fromPromise(
    fetch(url, { signal: signal }).then((r) => {
      if (!r.ok) {
        throw "";
      }
      return r.text();
    }),
    (_) => {
      console.error("error fetching channel", url.href, _);
      return ERRORS["invalid-url"];
    },
  );
  return result;
}

export const ERRORS = enumerate(["no-links", "invalid-url", "max-depth"]);

export function toUrl(input: unknown) {
  try {
    return ok(new URL(input as string));
  } catch {
    return err();
  }
}

export function timer(span: unknown) {
  let t1 = Date.now();

  return (label?: unknown) => {
    const now = Date.now();
    const t2 = now - t1;
    t1 = now;
    console.log(label ?? "", span, t2 / 1000, "s");
  };
}

export async function timed<T>(span: unknown, op: () => Promise<T>) {
  const t = timer(span);
  const result = await op();
  t();
  return result;
}
