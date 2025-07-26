import clsx from "clsx";
import { RssFeedListResponseSchemaType } from "./parse-feeds";
import { jsx, JSX } from "hono/jsx";
import { HtmlEscapedString } from "hono/utils/html";
import { toUrl } from "./utils";
import { Context } from "hono";

export async function Page(props: {
  result: {
    urlParam: string;
    feeds: RssFeedListResponseSchemaType["feeds"];
  } | null;
  context: Context;
}) {
  const hostname = toUrl(props.result?.urlParam)?.match(
    (url) => url.hostname,
    () => null,
  );
  const heading = (
    <h1
      class={"font-serif wrap-normal "}
      style={{ "view-transition-name": "header" }}
    >
      <span class={"italic font-old-standard"}>
        Does{" "}
        <span style={{ "view-transition-name": "hostname" }}>
          {hostname ?? "it"}
        </span>{" "}
      </span>

      <span class={"text-nowrap"}>
        <span class={"font-bitcount"}>RSS</span>?
      </span>
    </h1>
  );

  const feedCount = props.result?.feeds?.length;

  return (
    <main class="flex items-center flex-col px-8">
      {props.result?.urlParam ? (
        <>
          <div class={"mt-[25svh] mb-8 sm:mb-16 text-5xl md:text-5xl"}>
            {heading}
          </div>
          {typeof feedCount === "number" && (
            <div class={"mb-8 sm:mb-16 text-1xl "}>
              {feedCount === 0 && (
                <p>
                  There were no feeds found on provided{" "}
                  <a
                    href={toUrl(props.result.urlParam).match(
                      (t) => t.href,
                      () => "",
                    )}
                    class={"underline underline-offset-2"}
                  >
                    address
                  </a>
                </p>
              )}
              {feedCount > 0 && (
                <p>
                  It sure does, there{" "}
                  {feedCount > 1 ? (
                    <> were {feedCount} feeds</>
                  ) : (
                    <>was one feed</>
                  )}{" "}
                  found on provided{" "}
                  <a
                    href={toUrl(props.result.urlParam).match(
                      (t) => t.href,
                      () => "",
                    )}
                    class={"underline underline-offset-2"}
                  >
                    address
                  </a>
                  :
                </p>
              )}
            </div>
          )}
          <div class={"flex flex-col items-center"}>
            <div class="mb-8" style={{ "view-transition-name": "live-area" }}>
              {!!props.result?.feeds?.length ? (
                <ul>
                  {props.result.feeds.map((item) => (
                    <li class="bg-white rounded-lg sm:shadow-[2px_2px_black] p-4 mb-4 w-[80ch] max-w-[90vw] relative">
                      <dl>
                        <dt class={"hidden"}>title</dt>
                        <dd class={"sm font-bold sm:max-w-2/3"}>
                          {item.content.title}
                        </dd>
                        <dt class={"hidden"}>link</dt>
                        <dd class={"mb-2 sm:max-w-2/3"}>
                          <a
                            class={
                              "text-slate-600 underline underline-offset-1 wrap-break-word"
                            }
                            href={item.url}
                          >
                            {item.url} <ArrowTopRight class="w-4 inline" />
                          </a>
                        </dd>

                        <dt class={"hidden"}>description</dt>
                        <dd class={"italic"}>
                          {item.content.description || "Description not found"}
                        </dd>
                      </dl>

                      <a
                        href={`${item.parseLink}?pretty`}
                        class={
                          "max-sm:w-full max-sm:mt-2  text-center block sm:absolute sm:top-4 sm:right-4 p-1 px-2 font-bitcount-single border active:translate-x-[2px] active:translate-y-[2px] active:shadow-none! transition-transform"
                        }
                        style={{ boxShadow: "2px 2px black" }}
                      >
                        Parse to json
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <></>
              )}
            </div>
            <SubmitButton
              type="submit"
              name="client"
              value="ui"
              class={
                "group hover:border-b text-2xl  flex items-center-safe font-bitcount-single active:scale-95"
              }
              direction="left"
              href="/?autofocus=feed"
            >
              Go Back
            </SubmitButton>
          </div>
        </>
      ) : (
        <>
          <div class={"mt-[25svh] mb-16 sm:mb-32 text-7xl md:text-9xl"}>
            {heading}
          </div>
          <form
            class={
              "flex flex-col items-center w-screen sm:w-[60ch] max-w-[90vw] max-sm:rounded-t-4xl"
            }
            style={{ "view-transition-name": "live-area" }}
          >
            <div
              class={
                "flex flex-col p-6 bg-white gap-2 w-full rounded-lg shadow-[2px_2px_black]"
              }
            >
              <label htmlFor="feed" class={"font-bold"}>
                Web page address
              </label>
              <input
                class={
                  "border-b px-1 py-2 focus:bg-slate-100 valid:bg-slate-100"
                }
                name="feed"
                id="feed"
                value={props.result?.urlParam}
                placeholder="https://some.web"
                autofocus={props.context.req.query("autofocus") === "feed"}
                required
              />
            </div>
            <div class={"py-2"}></div>
            <SubmitButton
              type="submit"
              name="client"
              class={
                "group hover:border-b text-2xl m-2 flex items-center-safe font-bitcount-single active:scale-95"
              }
            >
              Let's find out
            </SubmitButton>
          </form>
        </>
      )}
    </main>
  );
}

function SubmitButton(
  props: JSX.HTMLAttributes & { direction?: "left" | "right"; href?: string },
) {
  const direction = props.direction ?? "right";

  return jsx(
    props.href ? "a" : "button",
    {
      ...props,
      class: clsx(
        "group hover:border-current border-b border-transparent text-2xl m-2 flex items-center-safe font-bitcount-single active:scale-95",
        props.class,
      ),
    },
    (
      <>
        {direction === "left" && (
          <ArrowRight class="w-6 -mr-4 scale-0 rotate-y-180 group-hover:mr-1 group-hover:scale-100  transition-all" />
        )}
        <span class={"pt-1"}>{props.children}</span>
        {direction === "right" && (
          <ArrowRight class="w-6 -ml-4 scale-0 group-hover:ml-0 group-hover:scale-100 transition-all" />
        )}
      </>
    ) as string,
  ) as unknown as HtmlEscapedString;
}

function ArrowRight(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-dasharray="1 2"
      class={clsx(
        props.class,
        "lucide lucide-arrow-right-icon lucide-arrow-right",
      )}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowTopRight(props: JSX.HTMLAttributes) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      {...props}
      class={clsx(
        props.class,
        "lucide lucide-arrow-up-right-icon lucide-arrow-up-right",
      )}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}
