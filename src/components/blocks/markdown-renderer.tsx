import { PlainTextCodeBlock } from "@/components/blocks/code/plaintext-code";
import { InlineCode } from "@/components/blocks/code/inline-code";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { onlyText } from "react-children-utilities";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const MarkdownRenderer: React.FC<{
  markdownText: string;
  className?: string;
  code?: {
    disableCodeHighlight?: boolean;
    ignoreFormattingErrors?: boolean;
    className?: string;
  };
  inlineCode?: {
    className?: string;
  };
  p?: {
    className?: string;
  };
  li?: {
    className?: string;
  };
  skipHtml?: boolean;
}> = (markdownProps) => {
  const { markdownText, className } = markdownProps;
  const commonHeadingClassName =
    "mb-2 pb-2 leading-5 font-semibold tracking-tight";

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={markdownProps.skipHtml}
        components={{
          h1: (props) => (
            <h2
              className={cn(
                commonHeadingClassName,
                "mb-4 border-border border-b text-3xl"
              )}
              {...cleanedProps(props)}
            />
          ),

          h2: (props) => (
            <h3
              {...cleanedProps(props)}
              className={cn(
                commonHeadingClassName,
                "mt-8 mb-4 border-border border-b text-2xl"
              )}
            />
          ),

          h3: (props) => (
            <h4
              {...cleanedProps(props)}
              className={cn(commonHeadingClassName, "mt-4 text-xl")}
            />
          ),

          h4: (props) => (
            <h5
              {...cleanedProps(props)}
              className={cn(commonHeadingClassName, "mt-4 text-lg")}
            />
          ),

          h5: (props) => (
            <h6
              {...cleanedProps(props)}
              className={cn(commonHeadingClassName, "mt-4 text-lg")}
            />
          ),

          h6: (props) => (
            <p
              {...cleanedProps(props)}
              className={cn(commonHeadingClassName, "mt-4 text-lg")}
            />
          ),

          a: (props) => (
            <Link
              href={props.href ?? "#"}
              target="_blank"
              {...cleanedProps(props)}
              className="mt-4 underline underline-offset-[5px] decoration-dotted text-foreground hover:decoration-solid"
            />
          ),

          code: ({ ...props }) => {
            if (props?.className) {
              return (
                <div className="my-4">
                  {/* @ts-expect-error - valid */}
                  <PlainTextCodeBlock
                    {...cleanedProps(props)}
                    code={onlyText(props.children).trim()}
                    className={markdownProps.code?.className}
                  />
                </div>
              );
            }

            return (
              <InlineCode
                code={onlyText(props.children).trim()}
                className={markdownProps.inlineCode?.className}
              />
            );
          },

          p: (props) => (
            <p
              className={cn(
                "mb-4 text-muted-foreground leading-loose",
                markdownProps.p?.className
              )}
              {...cleanedProps(props)}
            />
          ),

          table: (props) => (
            <div className="mb-6">
              <TableContainer>
                <Table {...cleanedProps(props)} />
              </TableContainer>
            </div>
          ),

          th: ({ children: c, ...props }) => (
            <TableHead
              {...cleanedProps(props)}
              className="text-left text-muted-foreground"
            >
              {c}
            </TableHead>
          ),

          td: (props) => (
            <TableCell {...cleanedProps(props)} className="text-left" />
          ),
          thead: (props) => <TableHeader {...cleanedProps(props)} />,
          tbody: (props) => <TableBody {...cleanedProps(props)} />,
          tr: (props) => <TableRow {...cleanedProps(props)} />,
          ul: (props) => {
            return (
              <ul
                className="mb-6 list-outside list-disc pl-5 [&_ol_li:first-of-type]:mt-1.5 [&_ul_li:first-of-type]:mt-1.5"
                {...cleanedProps(props)}
              />
            );
          },
          ol: (props) => (
            <ol
              className="mb-6 list-outside list-decimal pl-5 [&_ol_li:first-of-type]:mt-1.5 [&_ul_li:first-of-type]:mt-1.5"
              {...cleanedProps(props)}
            />
          ),
          li: ({ children: c, ...props }) => (
            <li
              className={cn(
                "mb-2 text-muted-foreground leading-loose [&>p]:m-0",
                markdownProps.li?.className
              )}
              {...cleanedProps(props)}
            >
              {c}
            </li>
          ),
          strong(props) {
            return (
              <strong className="font-semibold" {...cleanedProps(props)} />
            );
          },
          img: (_props) => {
            const props = cleanedProps(_props);
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="my-4 rounded-lg"
                src={props.src}
                {...props}
                alt={props.alt || ""}
              />
            );
          },
        }}
      >
        {markdownText}
      </ReactMarkdown>
    </div>
  );
};

function cleanedProps<T extends object & { node?: unknown }>(
  props: T
): Omit<T, "node"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { node, ...rest } = props;
  return rest;
}
