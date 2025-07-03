import { err, ok, Result } from "neverthrow";
import { DocumentQuery } from "./utils";

/**
 * Spec from https://www.rssboard.org/rss-specification
 *
 * RSS places restrictions on the first non-whitespace characters of the data in <link> and <url> elements. The data in these elements must begin with an IANA-registered URI scheme, such as http://, https://, news://, mailto: and ftp://.
 */
export type RssFeed = {
  title: string | undefined;
  /** The URL to the HTML website corresponding to the channel.*/
  link: string | undefined;
  description: string | undefined;
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
  const parsed = query.extract({
    channel: {
      selector: "channel",
      value: {
        description: ">description",
        title: ">title",
        link: ">link",
        language: ">language",
        copyright: ">copyright",
        managingEditor: ">managingEditor",
        webMaster: ">webMaster",
        pubDate: ">pubDate",
        lastBuildDate: ">lastBuildDate",
        categories: [
          {
            selector: ">category",
            value(el) {
              const elQuery = query(el);
              return { value: elQuery.text(), domain: elQuery.attr("domain") };
            },
          },
        ],
        generator: ">generator",
        docs: ">docs",
        ttl: ">ttl",
        rating: ">rating",
        image: {
          selector: ">image",
          value: {
            url: ">url",
            title: ">title",
            link: ">link",
            width: ">width",
            height: ">height",
            description: ">description",
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
        skipHours: [">skipHours>hour"],
        skipDays: [">skipDays>day"],
        textInput: {
          selector: ">textInput",
          value: {
            description: ">description",
            link: ">link",
            name: ">name",
            title: ">title",
          },
        },

        items: [
          {
            selector: ">item",
            value: {
              title: ">title",
              description: ">description",
              link: ">link",
              author: ">author",
              pubDate: ">pubDate",
              comments: ">comments",
              categories: [
                {
                  selector: ">category",
                  value(el) {
                    const elQuery = query(el);
                    return {
                      value: elQuery.text(),
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
                    value: elQuery.text(),
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
                    value: elQuery.text(),
                    url: elQuery.attr("url"),
                  };
                },
              },
            },
          },
        ],
      },
    },
  });

  if (parsed.channel) {
    return ok(parsed.channel);
  } else {
    return err(null);
  }
}
