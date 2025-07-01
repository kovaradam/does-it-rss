import * as cheerio from "cheerio";
import { ResultAsync } from "neverthrow";

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

export function fetchChannel(url: URL, signal: AbortSignal) {
  return ResultAsync.fromPromise(
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
}

export const ERRORS = enumerate(["no-links", "invalid-url", "max-depth"]);
