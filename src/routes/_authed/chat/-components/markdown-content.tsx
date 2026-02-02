import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn("space-y-2 text-sm leading-relaxed", className)}
      components={{
        a: ({ className: anchorClassName, ...props }) => (
          <a
            {...props}
            className={cn(
              "text-primary underline underline-offset-2",
              anchorClassName
            )}
            rel="noreferrer"
            target="_blank"
          />
        ),
        code: ({ inline, className: codeClassName, children, ...props }: CodeProps) =>
          inline ? (
            <code
              {...props}
              className={cn(
                "rounded bg-muted px-1 py-0.5 font-mono text-xs",
                codeClassName
              )}
            >
              {children}
            </code>
          ) : (
            <pre className="overflow-x-auto rounded-md bg-muted/30 p-3 text-xs">
              <code {...props} className={codeClassName}>
                {children}
              </code>
            </pre>
          ),
        ol: (props) => <ol {...props} className="ml-4 list-decimal space-y-1" />,
        ul: (props) => <ul {...props} className="ml-4 list-disc space-y-1" />,
        p: (props) => <p {...props} className="whitespace-pre-wrap" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
