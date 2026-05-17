# Full-text Review Explorer

A lightweight, self-hosted systematic review research tool. Provides thematic analysis, paper reviews, AI-powered search, and classification of research papers.

## Comparison with Covidence

| Feature | Covidence | Full-text Review Explorer |
|---|---|---|
| **Hosting** | Cloud SaaS | Local, fully client-side |
| **Import formats** | RIS, PubMed, CSV, reference managers | CSV (Covidence export), RIS |
| **Duplicate detection** | Automatic + manual resolution | Automatic (title + DOI matching) |
| **Screening stages** | Title/abstract, full-text (configurable) | Full-text review with status tracking |
| **Review statuses** | Include, exclude, maybe | Included, excluded, unreviewed |
| **Exclusion reasons** | Per-paper, configurable | Per-paper with presets + custom reasons |
| **Thematic classification** | Tags only | Hierarchical themes + flat tags |
| **Tag management** | Basic labels | CRUD with global registry, batch operations |
| **Inline editing** | Limited | All metadata fields editable inline |
| **Search** | Basic keyword | Title, abstract, author search |
| **AI-powered chat** | None | OpenAI-compatible chat panel with paper search |
| **Paper discovery via AI** | None | LLM references papers as clickable cards |
| **Batch operations** | Bulk actions | Multi-select with batch tag add/remove |
| **Conflict resolution** | Dual independent reviewers | Single reviewer |
| **Data export** | CSV, PRISMA flow diagram | Data in localStorage (no built-in export) |
| **Collaboration** | Multi-user with roles | Single user, local only |
| **Pricing** | Subscription-based | Free, open-source |
| **Data privacy** | Stored on Covidence servers | Stays in your browser |

## Features

### Review Workflow
- **Full-text review** - Track papers through included, excluded, and unreviewed statuses with one-click cycling.
- **Exclusion reasons** - Preset reasons (Not LLM-based MAS, Duplicate, Full text unavailable, Not primary research) plus free-text custom reasons.
- **Move back to screening** - Remove papers from the review entirely with a confirmation dialog.

### Thematic Classification
- **Hierarchical themes** - 10 predefined research themes with support for sub-themes. Full CRUD: create, rename, delete, and assign to papers.
- **Tags** - Flat tag system with a global registry. Create, assign, and remove tags from papers.
- **Batch operations** - Multi-select papers with Shift+click range selection, then batch add or remove tags.

### AI-Powered Chat
- **Research chat panel** - Slide-in panel with an OpenAI-compatible LLM (DeepSeek, OpenAI, Z.AI, local models, etc.).
- **Paper search via natural language** - Ask questions like "Find papers about oncology" and get clickable paper cards in responses.
- **Streaming responses** - Tokens appear in real-time as the LLM generates them.
- **Configurable** - Set Base URL, API Key, and Model via `.env` file or the in-app settings panel.

### Paper Management
- **Inline editing** - Edit any paper field (abstract, journal, year, authors, DOI, notes) directly in the detail modal.
- **Paper detail modal** - Full view with executive summary, key findings, system architecture, and single-LLM comparison sections.
- **Clickable DOIs** - Direct links to published papers via doi.org.

### Data Import
- **CSV import** - Import from Covidence CSV exports with automatic column mapping.
- **RIS import** - Import from RIS reference files with standard field mapping.
- **Duplicate detection** - Papers matched by title (case-insensitive) or DOI are automatically skipped.
- **Auto-theme creation** - Themes referenced in imported files are created automatically.

### Persistence
- All data stored in **localStorage** - papers, themes, and tags persist across sessions.
- **Seed data** - Ships with a built-in dataset of 76 research papers and 10 predefined themes.
- **Automatic migration** - Legacy data formats are upgraded seamlessly on load.

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 6 | Build tool and dev server |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| OpenAI SDK | AI chat integration |
| PapaParse | CSV parsing |
| TypeScript | Type safety |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/LaansDole/mas-health-explore.git
cd mas-health-explore

# Install dependencies
npm install
```

### Chat API Configuration

Copy the example env file and add your API credentials:

```bash
cp .env.example .env
```

Edit `.env` with your OpenAI-compatible API details:

```env
CHAT_BASE_URL=https://api.deepseek.com
CHAT_API_KEY=your-api-key-here
CHAT_MODEL=deepseek-chat
```

Any OpenAI-compatible provider works:

| Provider | Base URL | Example Model |
|---|---|---|
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| Z.AI (GLM) | `https://api.z.ai/api/paas/v4/` | `glm-5.1` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Local (Ollama) | `http://localhost:11434/v1` | `llama3` |

You can also configure these in the chat panel settings UI at runtime. UI overrides are saved in localStorage and take precedence over `.env` values.

### Run

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Other Commands

```bash
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # TypeScript type checking (tsc --noEmit)
npm run clean       # Remove build artifacts
```
