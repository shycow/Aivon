import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { Mermaid } from "./Mermaid";

// We use basic styling instead of rehype-highlight to keep dependencies light for now,
// but the architecture works the exact same.

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ ...props }) => <h1 className="text-[22px] font-semibold mt-6 mb-4" {...props} />,
        h2: ({ ...props }) => <h2 className="text-[18px] font-semibold mt-5 mb-3" {...props} />,
        h3: ({ ...props }) => <h3 className="text-[16px] font-semibold mt-4 mb-2" {...props} />,
        p: ({ ...props }) => <p className="mb-4 last:mb-0 leading-[1.7]" {...props} />,
        strong: ({ ...props }) => <strong className="font-semibold" {...props} />,
        em: ({ ...props }) => <em className="italic" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
        ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
        li: ({ ...props }) => <li className="pl-1" {...props} />,
        blockquote: ({ ...props }) => (
          <blockquote className="border-l-[3px] border-border-medium pl-4 italic text-text-secondary my-4" {...props} />
        ),
        table: ({ ...props }) => (
          <div className="w-full overflow-x-auto mb-4">
            <table className="w-full border-collapse border border-border-subtle" {...props} />
          </div>
        ),
        th: ({ ...props }) => <th className="border border-border-subtle bg-bg-tertiary px-4 py-2 text-left font-medium" {...props} />,
        td: ({ ...props }) => <td className="border border-border-subtle px-4 py-2" {...props} />,
        code: ({ className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !className;
          const language = match ? match[1] : "";

          if (language === "mermaid") {
            return <Mermaid chart={String(children).replace(/\n$/, "")} />;
          }
          
          if (isInline) {
            return (
              <code className="bg-bg-code text-text-code px-1.5 py-0.5 rounded-sm font-mono text-[0.85em]" {...props}>
                {children}
              </code>
            );
          }

          return (
            <div className="relative rounded-lg border border-border-subtle bg-bg-code my-4 overflow-hidden group">
              <div className="flex items-center justify-between px-4 py-2 bg-bg-tertiary border-b border-border-subtle text-xs text-text-secondary w-full">
                <span>{match ? match[1] : 'code'}</span>
                <button 
                  className="hover:text-text-primary transition-colors cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                >
                  Copy code
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-bg-code">
                <code className={className}>{children}</code>
              </pre>
            </div>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
