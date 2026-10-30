# nevotui

`nevotui` is a terminal-based portfolio application built with Rust, [Ratatui](https://github.com/ratatui/ratatui), and [Crossterm](https://github.com/crossterm-rs/crossterm). It presents the same portfolio data as the web portfolio in a keyboard-driven terminal interface.

The application fetches projects, technology groups, work experience, blog posts, and resume information from the live API at [nevo.is-a.dev](https://nevo.is-a.dev). It is designed as a small, focused Rust client rather than a static terminal snapshot.

## Features

- Six navigable screens: Home, Projects, Stack, Experience, Blog, and Links
- Asynchronous loading of portfolio data from the web API
- Project details with live-site and source-code links
- Blog list with on-demand loading of the selected post
- Scrollable stack, experience, project, and blog views
- Direct shortcuts for GitHub, LinkedIn, the web portfolio, email, and resume
- Graceful loading and error states for each API resource
- Optimized release profile with LTO, stripped symbols, and a single codegen unit

## Screens

| Screen | Purpose |
| --- | --- |
| Home | Introduction, tagline, and identity |
| Projects | Portfolio projects and links to live/source versions |
| Stack | Technology stack grouped by category |
| Experience | Work experience timeline |
| Blog | Blog summaries and a reader view |
| Links | Contact and external profile links |

## Requirements

- Rust toolchain with Cargo
- A terminal with ANSI escape support
- Network access at startup and when opening blog content

## Install from Git

```bash
cargo install --git https://github.com/iknevo/nevotui
nevotui
```

## Run from source

```bash
git clone https://github.com/iknevo/nevotui.git
cd nevotui
cargo run --release
```

## Keyboard shortcuts

### Global navigation

| Key | Action |
| --- | --- |
| `1`–`6` | Jump to a screen |
| `Tab` / `Shift+Tab` | Move to the next/previous screen |
| `h` / `←` | Return to Home |
| `q` | Quit |
| `Ctrl+C` | Quit immediately |

### Projects

| Key | Action |
| --- | --- |
| `j` / `k` | Move through projects |
| `f` / `/` | Toggle list/detail focus |
| `Enter` / `l` / `→` | Open the selected live URL |
| `s` | Open the selected source repository |
| `Esc` | Return focus to the project list |

### Stack and experience

| Key | Action |
| --- | --- |
| `j` / `k` | Scroll up/down |
| `PgUp` / `PgDn` | Scroll by a page |
| `Home` / `g` | Jump to the top |
| `End` / `G` | Jump to the bottom |

### Blog

| Key | Action |
| --- | --- |
| `j` / `k` | Move through posts or scroll the reader |
| `f` / `/` | Toggle list/reader focus |
| `Enter` / `l` / `→` | Load and open the selected post |
| `Esc` | Return to the post list |

### Links

| Key | Action |
| --- | --- |
| `g` | Open GitHub |
| `l` | Open LinkedIn |
| `w` | Open the web portfolio |
| `e` | Compose an email |
| `r` | Open the resume |

## Architecture

The application starts a Tokio runtime, creates a shared `reqwest` client, and launches independent API loaders for the main portfolio resources. The UI consumes those results through explicit loading states: `Loading`, `Ready`, or `Error`. Blog bodies are fetched only when a reader view is opened, keeping the initial load smaller.

The API contract is centralized in `src/api.rs`, while each screen has its own rendering module under `src/ui/`. This keeps data fetching, application state, input handling, and presentation separate without introducing a larger framework.

## Development

```bash
cargo check
cargo test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo run
```

The integration-style API smoke test requires network access because it verifies that the live portfolio API can deserialize projects, stack data, experience, blog posts, and resume information.

## License

[MIT](./LICENSE)
