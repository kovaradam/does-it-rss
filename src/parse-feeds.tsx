import { renderToString } from "hono/jsx/dom/server";
import {
  booleanFilter,
  filterUnique,
  getDocumentQuery,
  getIsRssChannel,
  normalizeHref,
  DocumentQuery,
  fetchChannel,
  ERRORS,
} from "./utils";
import { err, ok, Result } from "neverthrow";
import * as v from "valibot";
import { routes } from ".";
import { load } from "cheerio/slim";
import { getIsOpmlFile, parseFeedsFromOpml } from "./parse-feeds-from-opml";

export type DefinitionResult = {
  feedXml: string;
  content: { title: string; description: string | undefined };
  url: URL;
};

export const RssFeedListResponseSchema = v.object({
  feeds: v.array(
    v.object({
      content: v.object({
        title: v.string(),
        description: v.optional(v.string()),
      }),
      url: v.string(),
      parseLink: v.string(),
    }),
  ),
});

export type RssFeedListResponseSchemaType = v.InferOutput<
  typeof RssFeedListResponseSchema
>;

export async function getChannelsFromUrlPublic(
  url: URL,
  signal: AbortSignal,
): Promise<RssFeedListResponseSchemaType> {
  const result = await getChannelsFromUrl(url, signal)
    .then((channels) => channels.unwrapOr([]) ?? [])
    .then((channels) =>
      channels.map((channel) => ({
        url: channel.url.href,
        content: {
          title: load(channel.content.title ?? "").text(),
          description: load(channel.content.description ?? "").text(),
        },
        parseLink: routes["/json-feed"]
          .concat(`?feed=`)
          .concat(channel.url.href),
      })),
    );
  return { feeds: result };
}

export async function getChannelsFromUrl(
  url: URL,
  abortSignal: AbortSignal,
  recursion = {
    level: 0,
    fetched: [] as string[],
    parent: null as URL | null,
  },
): Promise<Result<DefinitionResult[] | null, keyof typeof ERRORS>> {
  const u = (linkUrl: string | URL) => new URL(linkUrl, url);

  const href = normalizeHref(url.href);
  if (recursion.level === 4 || recursion.fetched.includes(href)) {
    return err(ERRORS["max-depth"]);
  }

  const response = await fetchChannel(url, abortSignal);

  if (!response.isOk()) {
    return err(response.error);
  }

  recursion.fetched.push(href);

  const query = getDocumentQuery(response.value);

  const isRssChannelFile = getIsRssChannel(query);

  const isOpmlFile = getIsOpmlFile(query);

  if (isOpmlFile) {
    return ok(parseFeedsFromOpml(query));
  }

  if (isRssChannelFile) {
    return ok([
      {
        feedXml: response.value,
        url: u(url),
        content: getChannelMeta(query),
      },
    ]);
  } else if (
    recursion.parent &&
    !url.hostname.includes(recursion.parent.hostname)
  ) {
    // do not continue going through files outside of (sub)domain
    return ok([]);
  }

  const links = parseLinksFromHtml(query)
    .map((link) => ({
      url: u(normalizeHref(link.href)),
    }))
    .filter((l) =>
      // check arbitrary section of hostname to assert _some_ level of similarity
      l.url.hostname.includes(normalizeHref(url.hostname).slice(-5)),
    );

  if (!links.length) {
    return err(ERRORS["no-links"]);
  }

  const nextRecursion = {
    ...recursion,
    level: recursion.level + 1,
    parent: recursion.parent ?? url,
  };

  if (links.length === 1 && links[0]) {
    return getChannelsFromUrl(links[0].url, abortSignal, nextRecursion);
  }

  const traversedLinks = (
    await Promise.allSettled(
      links
        .filter((link) => link.url)
        .map(async (link) => {
          return getChannelsFromUrl(link.url, abortSignal, nextRecursion);
        }),
    )
  )
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value.unwrapOr(null))
    .filter(booleanFilter)
    .filter(
      filterUnique(
        (a, b) => normalizeHref(a.url.href) === normalizeHref(b.url.href),
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
    const href = e.attribs.href;

    if (typeof href !== "string") {
      return;
    }

    links.push({
      href: href,
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
