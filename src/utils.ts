import * as cheerio from "cheerio";

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
  return cheerio.load(xmlInput, { xml: true });
}

export type DocumentQuery = ReturnType<typeof getDocumentQuery>;

export function getIsRssChannel(query: DocumentQuery) {
  return query("feed,rss").length === 1;
}
