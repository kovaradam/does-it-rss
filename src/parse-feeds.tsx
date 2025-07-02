import { renderToString } from "hono/jsx/dom/server";
import {
  booleanFilter,
  filterUnique,
  getDocumentQuery,
  hrefToCompare,
  getIsRssChannel,
  normalizeHref,
  DocumentQuery,
  fetchChannel,
  ERRORS,
} from "./utils";
import { err, ok, Result } from "neverthrow";

export type DefinitionResult = {
  feedXml: string;
  content: { title: string; description: string | undefined };
  url: URL;
};

export async function getChannelsFromUrl(
  url: URL,
  abortSignal: AbortSignal,
  recursion = {
    level: 0,
    fetched: [] as string[],
    parent: null as string | null,
  },
): Promise<Result<DefinitionResult[] | null, keyof typeof ERRORS>> {
  const u = (linkUrl: string | URL) => new URL(linkUrl, url);

  const href = normalizeHref(url.href);
  if (recursion.level === 3 || recursion.fetched.includes(href)) {
    return err(ERRORS["max-depth"]);
  }

  const response = await fetchChannel(url, abortSignal);

  if (!response.isOk()) {
    return err(response.error);
  }

  recursion.fetched.push(href);

  const query = getDocumentQuery(response.value);

  const isRssChannelFile = getIsRssChannel(query);

  if (isRssChannelFile) {
    return ok([
      {
        feedXml: response.value,
        url: url,
        content: getChannelMeta(query),
      },
    ]);
  }

  const links = parseLinksFromHtml(query);

  if (!links.length) {
    return err(ERRORS["no-links"]);
  }

  const nextRecursion = {
    ...recursion,
    level: recursion.level + 1,
    parent: url.pathname,
  };

  if (links.length === 1 && links[0]) {
    return getChannelsFromUrl(u(links[0].href), abortSignal, nextRecursion);
  }

  const traversedLinks = (
    await Promise.allSettled(
      links
        .filter((link) => link.href)
        .map(async (link) => {
          return getChannelsFromUrl(u(link.href), abortSignal, nextRecursion);
        }),
    )
  )
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value.unwrapOr(null))
    .filter(booleanFilter)
    .filter(
      filterUnique(
        (a, b) => hrefToCompare(a.url.href) === hrefToCompare(b.url.href),
      ),
    );

  return ok(traversedLinks);
}

function getChannelMeta(query: DocumentQuery) {
  return {
    title: query(":is(feed,channel)>title:first-of-type").text().trim(),
    description:
      query(":is(feed,channel)>:is(description,subtitle):first-of-type")
        .text()
        .trim() || undefined,
  };
}

const RSS_LINK_QUERY = `
  [rel="alternate"][type="application/rss+xml"],
  [rel="alternate"][type="application/atom+xml"],
  [href*="rss" i],
  [href*="feed" i],
  [href*="atom" i],
  [title*="rss" i]
  `;

function parseLinksFromHtml(query: ReturnType<typeof getDocumentQuery>) {
  const linkElements = query(RSS_LINK_QUERY).filter(
    (_, e) => e.tagName === "link" || e.tagName === "a",
  );

  const links: Array<{ href: string }> = [];

  linkElements.each((_, e) => {
    if (typeof e.attribs.href !== "string") {
      return;
    }

    links.push({
      href: e.attribs.href,
    });
  });

  return links;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test("valid feed result", async () => {
    const result = parseLinksFromHtml(
      getDocumentQuery(
        renderToString(
          <html lang="en">
            <head>
              <link
                rel="alternate"
                href="link1"
                title="RSS"
                type="application/rss+xml"
              />
            </head>
            <body>
              <a href="/rss">rss feeds</a>
            </body>
          </html>,
        ),
      ),
    );

    expect(result.length).toBe(2);

    expect(result[0]?.href).toBe("link1");

    expect(result[1]?.href).toBe("/rss");
  });

  test("getChannelMeta handles unclosed tags", () => {
    const query =
      getDocumentQuery(`<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xml:base="https://henry.codes/" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <atom:link href="href.xml" rel="self" type="application/rss+xml" />
        <title>TITLE</title>
        <description>DESCRIPTION</description>
    </channel>
    </rss>`);

    const meta = getChannelMeta(query);

    expect(meta.title).toBe("TITLE");
    expect(meta.description).toBe("DESCRIPTION");
  });
}
