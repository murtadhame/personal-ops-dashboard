"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders markdown into clean typography. External links open in a new tab;
// internal links (starting with "/") navigate within the app.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const external = !!href && !href.startsWith("/") && !href.startsWith("#");
            return (
              <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                {children}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
