# Frontend Documentation

This directory contains the Next.js frontend application for the Stock & Economic Data project. It provides the user interface, fetches data via internal API routes (which proxy external financial APIs like **FMP (Financial Modeling Prep)** and **Finnhub**), and displays stock information, news, and charts.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui
*   **Charting:** lightweight-charts
*   **State Management:** React Server Components, `useState`, `useEffect` (as needed)
*   **Linting/Formatting:** ESLint
*   **API Caching:** Redis (optional, for FMP), Next.js fetch cache (for Finnhub)

## Project Structure

```
frontend/
├── app/                      # Next.js App Router directory
│   ├── api/                  # Internal backend API routes (server-side)
│   │   └── stock/            # Stock-related API endpoints
│   │       ├── av-candles/   # API route (currently uses FMP for historical data)
│   │       ├── candles/      # Finnhub candles API route
│   │       ├── company-news/ # Finnhub company news API route
│   │       ├── fmp-candles/  # FMP historical/intraday candles API route
│   │       ├── list/         # (Currently unused API route dir)
│   │       ├── news/         # Finnhub general market news API route
│   │       ├── peers/        # FMP company peers API route
│   │       ├── profile/      # FMP company profile API route
│   │       ├── quote/        # FMP stock quote API route
│   │       └── search/       # Finnhub symbol lookup API route
│   ├── stocks/               # Stock detail pages
│   │   └── [symbol]/         # Dynamic route for individual stock symbols
│   │       └── page.tsx      # Stock detail page component
│   ├── favicon.ico           # Favicon
│   ├── globals.css           # Global CSS styles (Tailwind base)
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Main landing page component (Stock List)
├── components/               # Reusable React components
│   ├── chart/                # Charting components
│   │   ├── CandlestickChart.tsx # Displays candlestick/line charts (lightweight-charts)
│   │   └── Sparkline.tsx     # Displays simple line charts for lists
│   ├── layout/               # Page layout components
│   │   ├── Header.tsx        # Application header
│   │   └── Sidebar.tsx       # Application sidebar
│   ├── stock/                # Stock-specific UI components
│   │   └── StockChartSection.tsx # Section containing the main chart and controls
│   ├── ui/                   # Base UI components (from shadcn/ui)
│   └── theme-provider.tsx    # Theme provider for light/dark mode
├── hooks/                    # Custom React hooks
│   └── use-mobile.ts         # Hook to detect mobile screen size
├── lib/                      # Library/helper functions & API clients
│   ├── alphaVantage.ts       # Alpha Vantage API client logic (Currently seems unused by API routes)
│   ├── api.ts                # Client-side data fetching functions (e.g., fetchStockList using FMP)
│   ├── finnhub.ts            # Finnhub API client logic (Handles News, Search, Candles)
│   ├── fmp.ts                # Financial Modeling Prep (FMP) API client logic (Handles Quote, Profile, Peers, Candles)
│   └── utils.ts              # Utility functions (e.g., `cn` for Tailwind classes)
├── node_modules/             # Project dependencies
├── public/                   # Static assets (images, svgs)
├── types/                    # TypeScript type definitions
│   └── stock.ts              # Stock-related type definitions
├── .gitignore                # Git ignore rules
├── .next/                    # Next.js build output directory
├── components.json           # shadcn/ui configuration
├── eslint.config.mjs         # ESLint configuration
├── next-env.d.ts             # Next.js environment types
├── next.config.ts            # Next.js configuration
├── package-lock.json         # Exact dependency versions
├── package.json              # Project metadata and dependencies
├── postcss.config.mjs        # PostCSS configuration (for Tailwind)
├── README.md                 # This file
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Key Components & Pages

*   **`app/layout.tsx`**: Root layout applying global structure, including `Header`, `Sidebar`, and `ThemeProvider`.
*   **`app/page.tsx`**: Main landing page displaying a list of tracked stocks (`AAPL`, `MSFT`, etc.) fetched directly using `lib/api.ts -> fetchStockList` (which uses FMP). Shows symbol, price, percentage change, and a `Sparkline` chart.
*   **`app/stocks/[symbol]/page.tsx`**: Dynamic page for individual stock details. Fetches data (profile, quote, historical candles, news, peers) via internal API routes (using FMP and Finnhub) and displays company info, stats, news, peers, and a detailed `CandlestickChart` within the `StockChartSection`.
*   **`components/chart/CandlestickChart.tsx`**: Renders interactive candlestick or line charts using `lightweight-charts`. Takes historical price data.
*   **`components/chart/Sparkline.tsx`**: Renders minimal line charts for previews.
*   **`components/layout/Header.tsx`**: Top navigation bar, potentially including search functionality.
*   **`components/layout/Sidebar.tsx`**: Side navigation or information panel.
*   **`components/stock/StockChartSection.tsx`**: Encapsulates the main chart on the stock detail page, possibly including time range selectors or other chart controls.

## API Routes (`app/api/stock/*`)

These server-side routes act as a backend proxy to external financial APIs, handling API key management, request formatting, and caching. The frontend components fetch data from these internal routes.

*   **`GET /api/stock/quote?symbol={symbol}`**: Fetches real-time quote data (**from FMP**).
*   **`GET /api/stock/profile?symbol={symbol}`**: Fetches company profile data (**from FMP**).
*   **`GET /api/stock/peers?symbol={symbol}`**: Fetches peer company symbols (**from FMP**).
*   **`GET /api/stock/search?q={query}`**: Searches for stock symbols (**from Finnhub**).
*   **`GET /api/stock/news?category={category}`**: Fetches general market news (**from Finnhub**).
*   **`GET /api/stock/company-news?symbol={...}`**: Fetches company-specific news (**from Finnhub**).
*   **`GET /api/stock/av-candles?symbol={symbol}`**: Fetches intraday/historical candles (**currently uses FMP**). *(Route name might be legacy)*.
*   **`GET /api/stock/candles?symbol={...}`**: Fetches historical candles (**from Finnhub** - potentially requires premium).
*   **`GET /api/stock/fmp-candles?symbol={...}`**: Fetches historical/intraday candles (**from FMP**).

*(Note: Refer to the specific `route.ts` file within each directory for exact parameters and response structure.)*

## Libraries (`lib/`)

*   **`alphaVantage.ts`**: Client for Alpha Vantage API. Seems currently **unused** by the main API routes. May contain legacy code or be used elsewhere. Requires `ALPHA_VANTAGE_API_KEY*` env variables if used. Includes Redis caching logic (`fetchAVWithCache`).
*   **`finnhub.ts`**: Client for Finnhub API. Used for News, Search, and specific Candle data. Uses Next.js fetch caching (`revalidate`). Requires `FINNHUB_API_KEY` env variable.
*   **`fmp.ts`**: Client for Financial Modeling Prep API. Used for Quotes, Profiles, Peers, and Candle data. Implements optional Redis caching (`fetchFMPWithCache`). Requires `FMP_API_KEY` and optional `REDIS_URL` env variables.
*   **`api.ts`**: Client-side functions primarily used by the main page (`page.tsx`) to fetch the stock list directly via FMP helpers.
*   **`utils.ts`**: General utility functions (e.g., `cn` for Tailwind class merging).

## Setup & Running

1.  **Install Dependencies:**
    ```bash
    cd frontend
    npm install
    # or yarn install / pnpm install
    ```
2.  **Environment Variables:** Create a `.env.local` file in the `frontend` directory. Add the following (obtain keys from the respective services):

    ```dotenv
    # Required for Finnhub data (News, Search, Finnhub Candles)
    FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY

    # Required for FMP data (Quotes, Profiles, Peers, FMP Candles)
    FMP_API_KEY=YOUR_FMP_API_KEY

    # Required: Base URL for API calls (client/server components)
    # Use http://localhost:3000 for local development
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # Optional: Alpha Vantage Keys (if lib/alphaVantage.ts is used elsewhere)
    # ALPHA_VANTAGE_API_KEY=YOUR_AV_KEY_1
    # ALPHA_VANTAGE_API_KEY2=YOUR_AV_KEY_2
    # ...

    # Optional: Redis for caching FMP data (and AV data if used)
    # Defaults to 'redis://localhost:6379' if FMP/AV caching is enabled in code
    # REDIS_URL=redis://:your_password@your_host:your_port

    # Optional: Disable Redis caching explicitly (if REDIS_URL is set but you want to disable)
    # DISABLE_REDIS_CACHE=true
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    # or yarn dev / pnpm dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm run start
```