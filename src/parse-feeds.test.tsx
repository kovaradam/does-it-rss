import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { getChannelsFromUrl } from "./parse-feeds";
import { renderToString } from "hono/jsx/dom/server";

const PAGE_URL = "https://web.page",
  FEEDS_PAGE_URL = PAGE_URL.concat("/rss"),
  FEED_MAIN_URL = FEEDS_PAGE_URL.concat("/feed.xml"),
  FEED_1_URL = FEEDS_PAGE_URL.concat("/feed-1.xml"),
  FEED_2_URL = FEEDS_PAGE_URL.concat("/feed-2.xml");

export const restHandlers = [
  http.get(PAGE_URL, () => {
    return HttpResponse.text(
      renderToString(
        <html lang="en">
          <head>
            <link
              rel="alternate"
              href={FEED_MAIN_URL}
              title="RSS"
              type="application/rss+xml"
            />
          </head>
          <body>
            <a href={FEEDS_PAGE_URL}>rss channels</a>
          </body>
        </html>,
      ),
    );
  }),
  http.get(FEEDS_PAGE_URL, () => {
    return HttpResponse.text(
      renderToString(
        <html lang="en">
          <head>
            <link
              rel="alternate"
              href={FEED_MAIN_URL}
              title="RSS"
              type="application/rss+xml"
            />
          </head>
          <body>
            <a href={FEED_MAIN_URL}>rss channel main</a>
            <a href={FEED_1_URL}>rss channel 1</a>
            <a href={FEED_2_URL}>rss channel 2</a>
          </body>
        </html>,
      ),
    );
  }),
  http.get(FEED_MAIN_URL, () => {
    return HttpResponse.text(TEST_FEED_DATA.TEST_CHANNEL_2);
  }),
  http.get(FEED_1_URL, () => {
    return HttpResponse.text(TEST_FEED_DATA.TEST_CHANNEL_3);
  }),
  http.get(FEED_2_URL, () => {
    return HttpResponse.text(TEST_FEED_DATA.TEST_CHANNEL_4);
  }),
];

const server = setupServer(...restHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

test("feed file link returns feed definition", async () => {
  const result = await getChannelsFromUrl(
    new URL(FEED_MAIN_URL),
    new AbortController().signal,
  );

  expect(result?.length).toBe(1);
  const feed = result?.[0];
  expect(feed?.content.title).toBe("Feed Name 2");
  expect(feed?.content.description).toBe("Feed Description 2");
});

test("page link returns links list", async () => {
  const result = await getChannelsFromUrl(
    new URL(PAGE_URL),
    new AbortController().signal,
  );

  expect(result?.length).toBe(3);
  const [feedMain, feed1, feed2] = result!;

  expect(feedMain?.url?.href).toBe(FEED_MAIN_URL);
  expect(feedMain?.feedXml).toBe(TEST_FEED_DATA.TEST_CHANNEL_2);
  expect(feedMain?.content.title).toBe("Feed Name 2");
  expect(feedMain?.content.description).toBe("Feed Description 2");

  expect(feed1?.url?.href).toBe(FEED_1_URL);
  expect(feed1?.feedXml).toBe(TEST_FEED_DATA.TEST_CHANNEL_3);
  expect(feed1?.content.title).toBe("Feed Name 3");
  expect(feed1?.content.description).toBe("Feed Description 3");

  expect(feed2?.url?.href).toBe(FEED_2_URL);
  expect(feed2?.feedXml).toBe(TEST_FEED_DATA.TEST_CHANNEL_4);
  expect(feed2?.content.title).toBe("Feed Name 4");
  expect(feed2?.content.description).toBe("Feed Description 4");
});

export const TEST_FEED_DATA = {
  TEST_CHANNEL_1: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
  <channel>
  <title>Feed Name</title>
  <link>https://link.com</link>
  <description></description>
  <language>cs</language>
  <item>
  <title>Item Title 1</title>
  <link>https://item.link</link>
  <description>Item description</description>
  <enclosure url="https://item.img" type="image/jpeg"/>
  <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
  </item>
  </channel>
  </rss>
  `,
  TEST_CHANNEL_2: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
  <channel>
  <title>Feed Name 2</title>
  <link>https://link.com</link>
  <description>Feed Description 2</description>
  <language>cs</language>
  <item>
  <title>Item Title 2</title>
  <link>https://item.link</link>
  <description>Item description</description>
  <enclosure url="https://item.img" type="image/jpeg"/>
  <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
  </item>
  </channel>
  </rss>
  `,
  TEST_CHANNEL_3: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
  <channel>
  <title>Feed Name 3</title>
  <link>https://link.com</link>
  <description>Feed Description 3</description>
  <language>cs</language>
  <item>
  <title>Item Title 1</title>
  <link>https://item.link</link>
  <description>Item description</description>
  <enclosure url="https://item.img" type="image/jpeg"/>
  <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
  </item>
  </channel>
  </rss>
  `,
  TEST_CHANNEL_4: `
  <?xml version="1.0" encoding="utf-8"?>
  <rss version="2.0">
  <channel>
  <title>Feed Name 4</title>
  <link>https://link.com</link>
  <description>Feed Description 4</description>
  <language>cs</language>
  <item>
  <title>Item Title 1</title>
  <link>https://item.link</link>
  <description>Item description</description>
  <enclosure url="https://item.img" type="image/jpeg"/>
  <pubDate>Sun, 25 May 2025 10:15:00 +0200</pubDate>
  </item>
  </channel>
  </rss>
  `,
};
