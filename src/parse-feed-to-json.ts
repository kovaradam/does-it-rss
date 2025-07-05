import { err, ok, Result } from "neverthrow";
import { DocumentQuery, getDocumentQueryFromUrl, toUrl } from "./utils";
import { load } from "cheerio/slim";

/**
 * Spec from https://www.rssboard.org/rss-specification
 *
 * RSS places restrictions on the first non-whitespace characters of the data in <link> and <url> elements. The data in these elements must begin with an IANA-registered URI scheme, such as http://, https://, news://, mailto: and ftp://.
 *
 * When a namespace element duplicates the functionality of an element defined in RSS, the core element should be used.
 */
export type RssFeed = {
  /**
   * Additional data
   */
  extensions?: {
    imageUrl: string | undefined;
  };

  title: string | undefined;
  /** The URL to the HTML website corresponding to the channel.*/
  link: string | undefined;
  description: string | undefined;
  /** The content:encoded element can be used in conjunction with the description element to provide an item's full content along with a shorter summary. Under this approach, the complete text of the item is presented in content:encoded and the summary in description. */
  "content:encoded": string | undefined;
  /** The license element, when present in an RSS channel or Atom feed element, indicates that all of the feed's content has been made available under a copyright license */
  "creativeCommons:license": string | undefined;
  "atom:link":
    | {
        href: string | undefined;
        length: string | undefined;
        hreflang: string | undefined;
        title: string | undefined;
        type: string | undefined;
        rel: string | undefined;
      }
    | undefined;
  /**
   * A channel may contain any number of <item>s. An item may represent a "story" -- much like a story in a newspaper or magazine; if so its description is a synopsis of the story, and the link points to the full story. An item may also be complete in itself, if so, the description contains the text (entity-encoded HTML is allowed; see examples), and the link and title may be omitted. All elements of an item are optional, however at least one of title or description must be present.
   */
  items: Array<{
    title: string | undefined;
    description: string | undefined;
    link: string | undefined;
    /**Email address of the author of the item. */
    author: string | undefined;
    /**Includes the item in one or more categories. */
    categories:
      | Array<{ value: string | undefined; domain: string | undefined }>
      | undefined;
    /**Indicates when the item was published. */
    pubDate: string | undefined;
    /**A string that uniquely identifies the item. */
    guid:
      | { value: string | undefined; isPermaLink: string | undefined }
      | undefined;
    /**	URL of a page for comments relating to the item. */
    comments: string | undefined;
    /** Describes a media object that is attached to the item. */
    enclosure:
      | {
          url: string | undefined;
          length: string | undefined;
          type: string | undefined;
        }
      | undefined;
    /** The RSS channel that the item came from. */
    source: { value: string | undefined; url: string | undefined } | undefined;
    "creativeCommons:license": RssFeed["creativeCommons:license"];
    /** The about element, when present in an item, identifies a trackback URL on another site that was pinged in response to the item  */
    "trackback:about": string | undefined;
    /** The ping element, when present in an item, identifies the item's trackback URL */
    "trackback:ping": string | undefined;
    "dc:creator": string | undefined;
    /** Tries to optimistically find image url from multiple elements */
    "extensions:imageUrl": string | undefined;
  }>;

  /** The language the channel is written in. This allows aggregators to group all Italian language sites, for example, on a single page. A list of allowable values for this element, as provided by Netscape, is here. You may also use values defined by the W3C.	en-us */
  language: string | undefined;
  /** Copyright notice for content in the channel.	Copyright 2002, Spartanburg Herald-Journal*/
  copyright: string | undefined;
  /** Email address for person responsible for editorial content.	geo@herald.com (George Matesky)*/
  managingEditor: string | undefined;
  /** Email address for person responsible for technical issues relating to channel.	betty@herald.com (Betty Guernsey)*/
  webMaster: string | undefined;
  /** The publication date for the content in the channel. For example, the New York Times publishes on a daily basis, the publication date flips once every 24 hours. That's when the pubDate of the channel changes. All date-times in RSS conform to the Date and Time Specification of RFC 822, with the exception that the year may be expressed with two characters or four characters (four preferred).	Sat, 07 Sep 2002 00:00:01 GMT*/
  pubDate: string | undefined;
  /** The last time the content of the channel changed.	Sat, 07 Sep 2002 09:42:31 GMT*/
  lastBuildDate: string | undefined;
  /** Specify one or more categories that the channel belongs to. Follows the same rules as the <item>-level category element. More info.	<category>Newspapers</category>*/
  categories: RssFeed["items"][number]["categories"];
  /** A string indicating the program used to generate the channel.	MightyInHouse Content System v2.3*/
  generator: string | undefined;
  /** A URL that points to the documentation for the format used in the RSS file. It's probably a pointer to this page. It's for people who might stumble across an RSS file on a Web server 25 years from now and wonder what it is.	https://www.rssboard.org/rss-specification*/
  docs: string | undefined;
  /** Allows processes to register with a cloud to be notified of updates to the channel, implementing a lightweight publish-subscribe protocol for RSS feeds. */
  cloud:
    | {
        /** attribute identifies the host name or IP address of the web service that monitors updates to the feed. */
        domain: string | undefined;
        /** attribute provides the web service's path. */
        path: string | undefined;
        /** attribute identifies the web service's TCP port. */
        port: string | undefined;
        /** attribute must contain the value "xml-rpc" if the service employs XML-RPC or "soap" if it employs SOAP. */
        protocol: string | undefined;
        /** attribute names the remote procedure to call when requesting notification of updates. */
        registerProcedure: string | undefined;
      }
    | undefined;
  /**	ttl stands for time to live. It's a number of minutes that indicates how long a channel can be cached before refreshing from the source. More info here.*/
  ttl: string | undefined;
  /** Specifies a GIF, JPEG or PNG image that can be displayed with the channel */
  image:
    | {
        /** is the URL of a GIF, JPEG or PNG image that represents the channel.*/
        url: string | undefined;
        /** describes the image, it's used in the ALT attribute of the HTML <img> tag when the channel is rendered in HTML.*/
        title: string | undefined;
        /** is the URL of the site, when the channel is rendered, the image is a link to the site. (Note, in practice the image <title> and <link> should have the same value as the channel's <title> and <link>.*/
        link: string | undefined;
        width: string | undefined;
        height: string | undefined;
        description: string | undefined;
      }
    | undefined;
  /**	The PICS rating for the channel. */
  rating: string | undefined;
  /**	Specifies a text input box that can be displayed with the channel. The purpose of the <textInput> element is something of a mystery. You can use it to specify a search engine box. Or to allow a reader to provide feedback. Most aggregators ignore it..*/
  textInput:
    | {
        /** The label of the Submit button in the text input area.*/
        title: string | undefined;
        /** Explains the text input area.*/
        description: string | undefined;
        /** The name of the text object in the text input area.*/
        name: string | undefined;
        /** The URL of the CGI script that processes text input requests.*/
        link: string | undefined;
      }
    | undefined;
  /** A hint for aggregators telling them which hours they can skip. This element contains up to 24 <hour> sub-elements whose value is a number between 0 and 23, representing a time in GMT, when aggregators, if they support the feature, may not read the channel on hours listed in the <skipHours> element. The hour beginning at midnight is hour zero. */
  skipHours: string[] | undefined;
  /** A hint for aggregators telling them which days they can skip. This element contains up to seven <day> sub-elements whose value is Monday, Tuesday, Wednesday, Thursday, Friday, Saturday or Sunday. Aggregators may not read the channel during days listed in the <skipDays> element.*/
  skipDays: string[] | undefined;
};

export function parseFeedToJson(query: DocumentQuery): Result<RssFeed, null> {
  const htmlVal = <T>(selector: T) => ({
    selector,
    value: "innerHTML",
  });

  const parsed = query.extract({
    channel: {
      selector: "channel",
      value: {
        description: htmlVal(">description"),
        title: htmlVal(">title"),
        link: htmlVal(">link"),
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
        copyright: htmlVal(">copyright"),
        managingEditor: htmlVal(">managingEditor"),
        webMaster: htmlVal(">webMaster"),
        pubDate: htmlVal(">pubDate"),
        lastBuildDate: htmlVal(">lastBuildDate"),
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
            selector: ">item",
            value: {
              title: htmlVal(">title"),
              description: htmlVal(">description"),
              link: htmlVal(">link"),
              author: htmlVal(">author"),
              pubDate: htmlVal(">pubDate"),
              comments: htmlVal(">comments"),
              "creativeCommons:license": htmlVal(">creativeCommons\\:license"),
              "dc:creator": htmlVal(">dc\\:creator"),
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
                selector: ">enclosure",
                value(el) {
                  const elQuery = query(el);
                  return {
                    url: elQuery.attr("url"),
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
                  "enclosure[type*='image'],media\\:content[medium*='image'],content\\:encoded",
                value(el) {
                  const elQuery = query(el);

                  switch (el.tagName) {
                    case "enclosure":
                    case "media:content":
                      return elQuery.attr("url");
                    case "content:encoded":
                    case "description":
                      return load(elQuery.text())("img").attr("src");
                  }
                },
              },
            },
          },
        ],
      },
    },
  });

  if (!parsed.channel) {
    return err(null);
  }

  return ok(parsed.channel);
}

export async function getFeedExtansions(feed: RssFeed) {
  const pageLink = toUrl(feed.link || feed["atom:link"]?.href);

  let channelImageUrl: string | undefined;

  if (pageLink.isOk()) {
    const pageQuery = await getDocumentQueryFromUrl(pageLink.value);
    if (pageQuery.isOk()) {
      channelImageUrl = pageQuery
        .value(`meta[property$="image"], meta[name$="image"]`)
        .attr("content");
    }
  }

  return { channelImage: channelImageUrl };
}
