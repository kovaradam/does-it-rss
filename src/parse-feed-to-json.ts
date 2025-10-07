import { err, ok, Result } from "neverthrow";
import { DocumentQuery, getDocumentQueryFromUrl, toUrl } from "./utils";
import { load } from "cheerio/slim";
import * as v from "valibot";

const RssItemSchema = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  link: v.optional(v.string()),
  /**Email address of the author of the item. */
  author: v.optional(v.string()),
  /**Includes the item in one or more categories. */
  categories: v.optional(
    v.array(
      v.object({
        value: v.optional(v.string()),
        domain: v.optional(v.string()),
      }),
    ),
  ),

  /**Indicates when the item was published. */
  pubDate: v.optional(v.string()),
  /**Indicates when the item was published. */
  updated: v.optional(v.string()),
  /**A string that uniquely identifies the item. */
  guid: v.optional(
    v.object({
      value: v.optional(v.string()),
      isPermaLink: v.optional(v.string()),
    }),
  ),
  /**	URL of a page for comments relating to the item. */
  comments: v.optional(v.string()),
  /** Describes a media object that is attached to the item. */
  enclosure: v.optional(
    v.object({
      url: v.optional(v.string()),
      length: v.optional(v.string()),
      type: v.optional(v.string()),
    }),
  ),
  /** The RSS channel that the item came from. */
  source: v.optional(
    v.object({ value: v.optional(v.string()), url: v.optional(v.string()) }),
  ),
  "creativeCommons:license": v.optional(v.string()),
  /** The about element, when present in an item, identifies a trackback URL on another site that was pinged in response to the item  */
  "trackback:about": v.optional(v.string()),
  /** The ping element, when present in an item, identifies the item's trackback URL */
  "trackback:ping": v.optional(v.string()),
  "dc:creator": v.optional(v.string()),
  /** Tries to optimistically find image url from multiple elements */
  "extensions:imageUrl": v.optional(v.string()),
});

/**
 * Spec from https://www.rssboard.org/rss-specification
 *
 * RSS places restrictions on the first non-whitespace characters of the data in <link> and <url> elements. The data in these elements must begin with an IANA-registered URI scheme, such as http://, https://, news://, mailto: and ftp://.
 *
 * When a namespace element duplicates the functionality of an element defined in RSS, the core element should be used.
 */
export const RssFeedSchema = v.object({
  /**
   * Additional data
   */
  extensions: v.optional(
    v.object({
      imageUrl: v.optional(v.string()),
    }),
  ),

  rssVersion: v.optional(v.string()),
  title: v.optional(v.string()),
  subtitle: v.optional(v.string()),
  /** The URL to the HTML website corresponding to the channel.*/
  link: v.optional(v.string()),
  description: v.optional(v.string()),
  /** The content:encoded element can be used in conjunction with the description element to provide an item's full content along with a shorter summary. Under this approach, the complete text of the item is presented in content:encoded and the summary in description. */
  "content:encoded": v.optional(v.string()),
  /** The license element, when present in an RSS channel or Atom feed element, indicates that all of the feed's content has been made available under a copyright license */
  "creativeCommons:license": v.optional(v.string()),
  "atom:link": v.optional(
    v.object({
      href: v.optional(v.string()),
      length: v.optional(v.string()),
      hreflang: v.optional(v.string()),
      title: v.optional(v.string()),
      type: v.optional(v.string()),
      rel: v.optional(v.string()),
    }),
  ),
  /**
   * A channel may contain any number of <item>s. An item may represent a "story" -- much like a story in a newspaper or magazine; if so its description is a synopsis of the story, and the link points to the full story. An item may also be complete in itself, if so, the description contains the text (entity-encoded HTML is allowed; see examples), and the link and title may be omitted. All elements of an item are optional, however at least one of title or description must be present.
   */
  items: v.optional(v.array(RssItemSchema)),

  /** The language the channel is written in. This allows aggregators to group all Italian language sites, for example, on a single page. A list of allowable values for this element, as provided by Netscape, is here. You may also use values defined by the W3C.	en-us */
  language: v.optional(v.string()),
  /** Copyright notice for content in the channel.	Copyright 2002, Spartanburg Herald-Journal*/
  copyright: v.optional(v.string()),
  /** Email address for person responsible for editorial content.	geo@herald.com (George Matesky)*/
  managingEditor: v.optional(v.string()),
  /** Email address for person responsible for technical issues relating to channel.	betty@herald.com (Betty Guernsey)*/
  webMaster: v.optional(v.string()),
  /** The publication date for the content in the channel. For example, the New York Times publishes on a daily basis, the publication date flips once every 24 hours. That's when the pubDate of the channel changes. All date-times in RSS conform to the Date and Time Specification of RFC 822, with the exception that the year may be expressed with two characters or four characters (four preferred).	Sat, 07 Sep 2002 00:00:01 GMT*/
  pubDate: v.optional(v.string()),
  /** The last time the content of the channel changed.	Sat, 07 Sep 2002 09:42:31 GMT*/
  lastBuildDate: v.optional(v.string()),
  /** Specify one or more categories that the channel belongs to. Follows the same rules as the <item>-level category element. More info.	<category>Newspapers</category>*/
  categories: v.optional(
    v.array(
      v.object({
        value: v.optional(v.string()),
        domain: v.optional(v.string()),
      }),
    ),
  ),
  /** A string indicating the program used to generate the channel.	MightyInHouse Content System v2.3*/
  generator: v.optional(v.string()),
  /** A URL that points to the documentation for the format used in the RSS file. It's probably a pointer to this page. It's for people who might stumble across an RSS file on a Web server 25 years from now and wonder what it is.	https://www.rssboard.org/rss-specification*/
  docs: v.optional(v.string()),
  /** Allows processes to register with a cloud to be notified of updates to the channel, implementing a lightweight publish-subscribe protocol for RSS feeds. */
  cloud: v.optional(
    v.object({
      /** attribute identifies the host name or IP address of the web service that monitors updates to the feed. */
      domain: v.optional(v.string()),
      /** attribute provides the web service's path. */
      path: v.optional(v.string()),
      /** attribute identifies the web service's TCP port. */
      port: v.optional(v.string()),
      /** attribute must contain the value "xml-rpc" if the service employs XML-RPC or "soap" if it employs SOAP. */
      protocol: v.optional(v.string()),
      /** attribute names the remote procedure to call when requesting notification of updates. */
      registerProcedure: v.optional(v.string()),
    }),
  ),
  /**	ttl stands for time to live. It's a number of minutes that indicates how long a channel can be cached before refreshing from the source. */
  ttl: v.optional(v.string()),
  /** Specifies a GIF, JPEG or PNG image that can be displayed with the channel */
  image: v.optional(
    v.object({
      /** is the URL of a GIF, JPEG or PNG image that represents the channel.*/
      url: v.optional(v.string()),
      /** describes the image, it's used in the ALT attribute of the HTML <img> tag when the channel is rendered in HTML.*/
      title: v.optional(v.string()),
      /** is the URL of the site, when the channel is rendered, the image is a link to the site. (Note, in practice the image <title> and <link> should have the same value as the channel's <title> and <link>.*/
      link: v.optional(v.string()),
      width: v.optional(v.string()),
      height: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  ),
  /**	The PICS rating for the channel. */
  rating: v.optional(v.string()),
  /**	Specifies a text input box that can be displayed with the channel. The purpose of the <textInput> element is something of a mystery. You can use it to specify a search engine box. Or to allow a reader to provide feedback. Most aggregators ignore it..*/
  textInput: v.optional(
    v.object({
      /** The label of the Submit button in the text input area.*/
      title: v.optional(v.string()),
      /** Explains the text input area.*/
      description: v.optional(v.string()),
      /** The name of the text object in the text input area.*/
      name: v.optional(v.string()),
      /** The URL of the CGI script that processes text input requests.*/
      link: v.optional(v.string()),
    }),
  ),
  /** A hint for aggregators telling them which hours they can skip. This element contains up to 24 <hour> sub-elements whose value is a number between 0 and 23, representing a time in GMT, when aggregators, if they support the feature, may not read the channel on hours listed in the <skipHours> element. The hour beginning at midnight is hour zero. */
  skipHours: v.optional(v.array(v.string())),
  /** A hint for aggregators telling them which days they can skip. This element contains up to seven <day> sub-elements whose value is Monday, Tuesday, Wednesday, Thursday, Friday, Saturday or Sunday. Aggregators may not read the channel during days listed in the <skipDays> element.*/
  skipDays: v.optional(v.array(v.string())),
});

type RssFeed = v.InferOutput<typeof RssFeedSchema>;

export function parseFeedToJson(query: DocumentQuery): Result<RssFeed, null> {
  const htmlVal = <T>(selector: T) => ({
    selector,
    value: "innerHTML",
  });

  const parsed = query.extract({
    rssVersion: {
      selector: "rss",
      value(el) {
        return query(el).attr("version");
      },
    },
    channel: {
      selector: "channel,feed",
      value: {
        description: htmlVal(">description"),
        title: htmlVal(">title"),
        subtitle: htmlVal(">subtitle"),
        link: {
          selector: ">link",
          value(el) {
            const elQuery = query(el);
            return elQuery.html() || elQuery.attr("href");
          },
        },
        "content:encoded": htmlVal(">content\\:encoded"),
        "creativeCommons:license": htmlVal(">creativeCommons\\:license"),
        "atom:link": {
          selector: ">atom\\:link",
          value(el) {
            const elQuery = query(el);

            return {
              href: elQuery.attr("href"),
              length: elQuery.attr("length"),
              hreflang: elQuery.attr("hreflang"),
              title: elQuery.attr("title"),
              type: elQuery.attr("type"),
              rel: elQuery.attr("rel"),
            };
          },
        },
        language: htmlVal(">language"),
        copyright: htmlVal(">copyright,>rights"),
        managingEditor: htmlVal(">managingEditor"),
        webMaster: htmlVal(">webMaster"),
        pubDate: htmlVal(">pubDate"),
        lastBuildDate: htmlVal(">lastBuildDate,>updated"),
        categories: [
          {
            selector: ">category",
            value(el) {
              const elQuery = query(el);
              return {
                value: elQuery.html() ?? undefined,
                domain: elQuery.attr("domain"),
              };
            },
          },
        ],
        generator: htmlVal(">generator"),
        docs: htmlVal(">docs"),
        ttl: htmlVal(">ttl"),
        rating: htmlVal(">rating"),
        image: {
          selector: ">image",
          value: {
            url: htmlVal(">url"),
            title: htmlVal(">title"),
            link: htmlVal(">link"),
            width: htmlVal(">width"),
            height: htmlVal(">height"),
            description: htmlVal(">description"),
          },
        },
        cloud: {
          selector: ">cloud",
          value(el) {
            const elQuery = query(el);
            return {
              domain: elQuery.attr("domain"),
              path: elQuery.attr("path"),
              port: elQuery.attr("port"),
              protocol: elQuery.attr("protocol"),
              registerProcedure: elQuery.attr("registerProcedure"),
            };
          },
        },
        skipHours: [htmlVal(">skipHours>hour")],
        skipDays: [htmlVal(">skipDays>day")],
        textInput: {
          selector: ">textInput",
          value: {
            description: htmlVal(">description"),
            link: htmlVal(">link"),
            name: htmlVal(">name"),
            title: htmlVal(">title"),
          },
        },

        items: [
          {
            selector: ">item,>entry",
            value: {
              title: htmlVal(">title"),
              description: htmlVal(
                ">description,>content,>summary,>content\\:encoded",
              ),
              link: {
                selector: ">link",
                value(el) {
                  const elQuery = query(el);
                  return elQuery.html() || elQuery.attr("href");
                },
              },
              author: htmlVal(">author"),
              pubDate: htmlVal(">pubDate,>published"),
              updated: htmlVal(">updated"),
              comments: htmlVal(">comments"),
              "creativeCommons:license": htmlVal(">creativeCommons\\:license"),
              "dc:creator": htmlVal(">dc\\:creator"),
              categories: [
                {
                  selector: ">category",
                  value(el) {
                    const elQuery = query(el);
                    return {
                      value:
                        (elQuery.html() || elQuery.attr("term")) ?? undefined,
                      domain: elQuery.attr("domain"),
                    };
                  },
                },
              ],

              guid: {
                selector: ">guid",
                value(el) {
                  const elQuery = query(el);
                  return {
                    value: elQuery.html() ?? undefined,
                    isPermaLink: elQuery.attr("isPermaLink"),
                  };
                },
              },
              enclosure: {
                selector: ">enclosure,>link[rel='enclosure']",
                value(el) {
                  const elQuery = query(el);
                  return {
                    url: elQuery.attr("url") || elQuery.attr("href"),
                    length: elQuery.attr("length"),
                    type: elQuery.attr("type"),
                  };
                },
              },
              source: {
                selector: ">source",
                value(el) {
                  const elQuery = query(el);
                  return {
                    value: elQuery.html() ?? undefined,
                    url: elQuery.attr("url"),
                  };
                },
              },

              "trackback:about": {
                selector: ">trackback\\:about",
                value(el) {
                  const elQuery = query(el);
                  return elQuery.text() || elQuery.attr("rdf:resource");
                },
              },
              "trackback:ping": {
                selector: ">trackback\\:ping",
                value(el) {
                  const elQuery = query(el);
                  return elQuery.text() || elQuery.attr("rdf:resource");
                },
              },

              "extensions:imageUrl": {
                selector:
                  "enclosure[type*='image'],media\\:content[medium*='image'],content\\:encoded,itunes\\:image",
                value(el) {
                  const elQuery = query(el);

                  switch (el.tagName) {
                    case "itunes:image":
                      return elQuery.attr("href");
                    case "enclosure":
                    case "media:content":
                      return elQuery.attr("url");
                    case "content:encoded":
                    case "description": {
                      const textQuery = load(elQuery.text());
                      return textQuery("img").attr("src");
                    }
                  }
                },
              },
            },
          },
        ],
      },
    },
  });

  if (parsed.channel) {
    Object.assign(parsed.channel, { rssVersion: parsed.rssVersion });
    return ok(parsed.channel);
  } else {
    return err(null);
  }
}

export async function getFeedExtensions(
  feed: RssFeed,
  feedUrl: URL,
  signal: AbortSignal,
) {
  const pageLink = toUrl(
    feed.link || feed["atom:link"]?.href || feedUrl.origin,
  );

  let channelImageUrl: string | undefined;

  if (pageLink.isOk()) {
    const pageQuery = await getDocumentQueryFromUrl(pageLink.value, signal);

    if (pageQuery.isOk()) {
      channelImageUrl = pageQuery
        .value(`meta[property$="image"],meta[name$="image"]`)
        .attr("content");
    }
  }

  return { channelImage: channelImageUrl };
}

/**
 * Create some form of fingerprint for the feed so that the consumer
 * can decide whether they want to update.
 */
export async function getHash(feed: RssFeed) {
  const source = `${feed.lastBuildDate}${feed.items?.map((i) => i.guid || i.link || i.title).join("")}`;
  const digest = await crypto.subtle.digest(
    { name: "sha-256" },
    new TextEncoder().encode(source),
  );

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const RssFeedResponseSchema = v.object({
  feed: RssFeedSchema,
});

export type RssFeedResponseSchemaType = v.InferOutput<
  typeof RssFeedResponseSchema
>;
