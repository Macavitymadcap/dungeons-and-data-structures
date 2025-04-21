# Dungeons and Data Structures

An interactive exploration into the data structures and algorithm used in TTRPGs and Choose Your Own Adventure 
Gamebooks. This repository includes a [public site](https://Macavitymadcap.github.io/dungeons-and-data-structures/)
hosted with [GitHub Pages](https://pages.github.com/) and all the research and development for the project.

The front end is built with [Deno](https://deno.land/), [Alipne js](https://alpinejs.dev/) and
[htmx](https://htmx.org/). [Mermaid](https://mermaid-js.github.io/mermaid/#/) is used to render graphs and diagrams,
and [highlight.js](https://highlightjs.org/) is used to render code blocks.

## Usage

Install the dev dependencies: `deno install` and then run one of the following:

- `deno task dev`: run dev server for the public site
- `deno task mermaid`: run dev server for viewing mermaid diagrams
- `deno task game`: run CLI version of simple five room dungeon4