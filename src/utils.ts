import { load } from "cheerio/slim";
import { err, fromPromise, ok, ResultAsync } from "neverthrow";
import { FetchOptions, ofetch } from "ofetch";

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
  const result = href.replace("www.", "");
  if (result.endsWith("/")) {
    return normalizeHref(result.slice(0, -1));
  }
  return result;
}

export function enumerate<T extends readonly string[]>(
  input: [...T],
): { [key in T[number]]: key } {
  return Object.fromEntries(input.map((v) => [v, v])) as ReturnType<
    typeof enumerate<T>
  >;
}

const parserOptions = {
  scriptingEnabled: false,
  xml: {
    decodeEntities: false,
  },
};

export function getDocumentQuery(input: string) {
  return load(input, parserOptions, false);
}

export async function getDocumentQueryFromUrl(input: URL, signal: AbortSignal) {
  return fromPromise(
    fetchDocument(input, {
      signal,
    }).then(getDocumentQuery),
    (e) => {
      console.error(e);
      err(e);
    },
  );
}

export type DocumentQuery = ReturnType<typeof getDocumentQuery>;

export function getIsRssChannel(query: DocumentQuery) {
  return query("feed,rss").length === 1;
}

export async function fetchChannel(url: URL, signal: AbortSignal) {
  const result = await ResultAsync.fromPromise(
    fetchDocument(url, {
      signal: signal,
    }),
    (_) => {
      console.error("error fetching channel", url.href, _);
      return ERRORS["invalid-url"];
    },
  );
  return result;
}

async function fetchDocument(url: URL, init: FetchOptions) {
  // Using ofetch because it retries failed requests
  return ofetch(url.pathname, {
    ...init,
    baseURL: url.origin,
    headers: {
      ...init?.headers,
      // Some services don't like node
      "user-agent": "curl",
    },
    parseResponse: (txt) => txt,
  });
}

export const ERRORS = enumerate(["no-links", "invalid-url", "max-depth"]);

export function toUrl(input: unknown) {
  const withScheme = String(input).startsWith("http")
    ? (input as string)
    : typeof input === "string"
      ? `https://${input}`
      : input;

  try {
    const url = new URL(withScheme as string);
    if (url.origin) {
      return ok(url);
    } else {
      return err();
    }
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

export async function timed<T>(span: unknown, op: Promise<T>) {
  const t = timer(span);
  const result = await op;
  t();
  return result;
}
