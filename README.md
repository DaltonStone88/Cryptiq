# Cryptiq — Neural Trading Engine

A modular algorithmic trading platform where developers publish trading bots and users subscribe and assign them to individual coins in their portfolio.

## Features

- **Dashboard** — Portfolio overview, performance charts, active algorithm monitoring, and per-coin bot assignment
- **Algorithm Marketplace** — Browse, filter, and subscribe to trading algorithms built by top developers
- **Connections** — Manage exchange API keys (Binance, Coinbase, etc.) and wallet connections (MetaMask, Phantom)
- **Settings** — Profile, security, trading preferences, and developer API access
- **Live Ticker** — Real-time scrolling coin prices across the top of the platform

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool and dev server
- **Custom CSS** — No UI library dependencies

## Project Structure

```
cryptiq/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## License

MIT
