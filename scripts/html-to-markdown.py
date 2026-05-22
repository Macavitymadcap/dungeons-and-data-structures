#!/usr/bin/env python3
"""Convert published HTML fragments to reviewable Markdown."""

from __future__ import annotations

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path


BLOCK_TAGS = {"p", "blockquote", "ul", "ol", "li", "details", "summary", "menu", "div"}


class MarkdownConverter(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.inline_stack: list[str] = []
        self.list_stack: list[dict[str, int | str]] = []
        self.skip_depth = 0
        self.in_pre = False
        self.in_code_block = False
        self.code_language = ""
        self.in_mermaid = False
        self.link_stack: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_map = {name: value or "" for name, value in attrs}
        if tag in {"head", "script", "style"}:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return

        if tag == "pre":
            self.ensure_blank_line()
            self.in_pre = True
            return
        if tag == "code" and self.in_pre:
            classes = attrs_map.get("class", "")
            match = re.search(r"language-([\w-]+)", classes)
            self.code_language = match.group(1) if match else ""
            self.parts.append(f"```{self.code_language}\n")
            self.in_code_block = True
            return
        if self.in_code_block:
            return

        if tag == "div" and "mermaid" in attrs_map.get("class", "").split():
            self.ensure_blank_line()
            self.parts.append("```mermaid\n")
            self.in_mermaid = True
            return

        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.ensure_blank_line()
            self.parts.append("#" * int(tag[1]) + " ")
        elif tag == "p":
            self.ensure_blank_line()
        elif tag == "blockquote":
            self.ensure_blank_line()
        elif tag in {"strong", "b"}:
            self.parts.append("**")
            self.inline_stack.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
            self.inline_stack.append("*")
        elif tag == "code":
            self.parts.append("`")
            self.inline_stack.append("`")
        elif tag == "a":
            self.parts.append("[")
            self.link_stack.append(attrs_map.get("href", ""))
        elif tag in {"ul", "menu"}:
            self.ensure_blank_line()
            self.list_stack.append({"type": "ul", "index": 0})
        elif tag == "ol":
            self.ensure_blank_line()
            self.list_stack.append({"type": "ol", "index": 0})
        elif tag == "li":
            self.ensure_new_line()
            depth = max(len(self.list_stack) - 1, 0)
            prefix = "- "
            if self.list_stack and self.list_stack[-1]["type"] == "ol":
                self.list_stack[-1]["index"] = int(self.list_stack[-1]["index"]) + 1
                prefix = f"{self.list_stack[-1]['index']}. "
            self.parts.append("  " * depth + prefix)
        elif tag == "summary":
            self.ensure_blank_line()
            self.parts.append("**")
            self.inline_stack.append("**")
        elif tag == "img":
            alt = attrs_map.get("alt", "")
            src = attrs_map.get("src", "")
            self.ensure_blank_line()
            self.parts.append(f"![{alt}]({src})")
            self.ensure_blank_line()
        elif tag == "br":
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"head", "script", "style"} and self.skip_depth:
            self.skip_depth -= 1
            return
        if self.skip_depth:
            return

        if self.in_code_block and tag == "code":
            self.parts.append("\n```\n")
            self.in_code_block = False
            return
        if self.in_pre and tag == "pre":
            self.in_pre = False
            self.ensure_blank_line()
            return
        if self.in_code_block:
            return
        if self.in_mermaid and tag == "div":
            self.parts.append("\n```\n")
            self.in_mermaid = False
            self.ensure_blank_line()
            return

        if tag in {"h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote", "details"}:
            self.ensure_blank_line()
        elif tag in {"strong", "b", "em", "i", "code", "summary"} and self.inline_stack:
            self.parts.append(self.inline_stack.pop())
            if tag == "summary":
                self.ensure_blank_line()
        elif tag == "a" and self.link_stack:
            href = self.link_stack.pop()
            self.parts.append(f"]({href})")
        elif tag in {"ul", "ol", "menu"} and self.list_stack:
            self.list_stack.pop()
            self.ensure_blank_line()
        elif tag == "li":
            self.ensure_new_line()

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        if self.in_code_block or self.in_mermaid:
            self.parts.append(data)
            return
        text = re.sub(r"\s+", " ", data).strip()
        if not text:
            return
        if data[:1].isspace() and self.parts:
            previous = self.parts[-1]
            if previous and not previous[-1].isspace() and not previous.endswith("["):
                self.parts.append(" ")
        self.parts.append(text)
        if data[-1:].isspace():
            self.parts.append(" ")

    def ensure_new_line(self) -> None:
        if self.parts and not self.parts[-1].endswith("\n"):
            self.parts.append("\n")

    def ensure_blank_line(self) -> None:
        text = "".join(self.parts)
        if not text:
            return
        if text.endswith("\n\n"):
            return
        if text.endswith("\n"):
            self.parts.append("\n")
        else:
            self.parts.append("\n\n")

    def markdown(self) -> str:
        text = "".join(self.parts)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{2,}[ \t]+", "\n\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip() + "\n"


def convert_file(source: Path, target: Path) -> None:
    parser = MarkdownConverter()
    parser.feed(source.read_text(encoding="utf-8"))
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(parser.markdown(), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("public"))
    parser.add_argument("--target", type=Path, default=Path("docs/published"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    html_files = sorted(args.source.glob("*.html"))
    for source in html_files:
        target = args.target / f"{source.stem}.md"
        convert_file(source, target)
        print(f"{source} -> {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
