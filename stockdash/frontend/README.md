# Frontend Documentation

This directory contains the Next.js frontend application for the Stock & Economic Data project. It handles user interface, data fetching from backend API routes, and interaction with external financial data APIs (Finnhub, Alpha Vantage).

## Project Structure Overview

```
frontend/
├── app/                      # Next.js App Router directory
│   ├── api/                  # Backend API routes
│   │   └── stock/            # Stock-related API endpoints
│   │       ├── av-candles/   # Alpha Vantage intraday candles
│   │       ├── candles/      # Finnhub candles (Premium/Fallback)
│   │       ├── company-news/ # Company-specific news
│   │       ├── list/         # Predefined list of stocks with quotes & history
│   │       ├── news/         # General market news
│   │       ├── peers/        # Company peers
│   │       ├── profile/      # Company profile
│   │       ├── quote/        # Stock quote
│   │       └── search/       # Symbol lookup
│   ├── stocks/               # Stock detail pages
│   │   └── [symbol]/         # Dynamic route for individual stock symbols
│   │       └── page.tsx      # Stock detail page component
│   ├── favicon.ico           # Favicon
│   ├── globals.css           # Global CSS styles (Tailwind base)
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Main landing page component (Stock List)
├── components/               # Reusable UI components
│   ├── chart/                # Chart components (Candlestick, Sparkline)
│   ├── layout/               # Layout components (Header, Sidebar)
│   ├── ui/                   # Base UI components (Button, Card, etc. - shadcn/ui)
│   └── theme-provider.tsx    # Theme provider for light/dark mode (if implemented)
├── hooks/                    # Custom React hooks
│   └── use-mobile.ts         # Hook to detect mobile screen size
├── lib/                      # Library/helper functions
│   ├── alphaVantage.ts       # Alpha Vantage API interaction logic (with caching & key rotation)
│   ├── api.ts                # Client-side API fetching helpers (e.g., fetchStockList)
│   ├── finnhub.ts            # Finnhub API interaction logic (with Next.js caching)
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

## Key Files and Directories

### `app/`
Contains the core application logic using the Next.js App Router.

*   **`layout.tsx`**: The root layout that wraps all pages. It likely includes the main HTML structure, `ThemeProvider`, and potentially the `Header` and `Sidebar` components.
*   **`page.tsx`**: The main landing page of the application. It displays a list of predefined stocks (`AAPL`, `MSFT`, etc.) along with their current price, percentage change, and a sparkline chart showing recent history. It fetches data using the `fetchStockList` function which calls the `/api/stock/list` endpoint.
*   **`globals.css`**: Contains base styles, Tailwind directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`), and any custom global CSS.
*   **`stocks/[symbol]/page.tsx`**: A dynamic route page that displays detailed information for a specific stock symbol.
    *   It takes the `symbol` from the URL path.
    *   Fetches profile, quote, and historical candle data using the backend API routes (`/api/stock/profile`, `/api/stock/quote`, `/api/stock/av-candles`).
    *   Displays the stock name, price, change, a candlestick chart, company information (CEO, HQ, etc.), key statistics (Market Cap, P/E, Volume, etc.), and potentially peers.
    *   Includes error handling for cases where API calls fail or data is unavailable.
    *   Uses the `CandlestickChart` component to render historical data.
    *   Uses shadcn/ui components (`Button`, `Separator`, `Tabs`) for UI elements.

### `app/api/`
Contains backend API route handlers built with Next.js API Routes. These run on the server-side.

**How Next.js API Routes Work:**
Files inside `app/api/...` define serverless functions that handle HTTP requests. A file named `route.ts` within a directory (e.g., `app/api/stock/quote/route.ts`) defines handlers for different HTTP methods (like `GET`, `POST`). These routes can fetch data from external APIs, databases, or perform other server-side logic, and then return JSON responses to the frontend. The frontend fetches data from these routes using `fetch` requests to relative paths (e.g., `/api/stock/quote`).

**Stock API Endpoints (`/api/stock/*`)**

All stock-related API routes reside under `/api/stock/`. They primarily act as proxies to the Finnhub and Alpha Vantage APIs, adding caching and potentially consolidating data.

*   **`GET /api/stock/quote?symbol={symbol}`**
    *   **Purpose:** Fetches the latest quote data for a given stock symbol.
    *   **Handler:** `app/api/stock/quote/route.ts`
    *   **Library Function:** `lib/finnhub.ts -> getQuote(symbol)`
    *   **Request:** Requires `symbol` query parameter (e.g., `?symbol=AAPL`).
    *   **Response Body (Example):** Finnhub Quote Object
        ```json
        {
          "c": 214.29,  // Current price
          "d": 1.07,    // Change
          "dp": 0.5018, // Percent change
          "h": 215.17,  // High price of the day
          "l": 211.3,   // Low price of the day
          "o": 211.75,  // Open price of the day
          "pc": 213.22, // Previous close price
          "t": 1718996400 // Timestamp
        }
        ```

*   **`GET /api/stock/profile?symbol={symbol}`**
    *   **Purpose:** Fetches company profile information.
    *   **Handler:** `app/api/stock/profile/route.ts`
    *   **Library Function:** `lib/finnhub.ts -> getCompanyProfile(symbol)`
    *   **Request:** Requires `symbol` query parameter.
    *   **Response Body (Example):** Finnhub Profile Object
        ```json
        {
          "country": "US",
          "currency": "USD",
          "exchange": "NASDAQ NMS - GLOBAL MARKET",
          "name": "Apple Inc",
          "ticker": "AAPL",
          "ipo": "1980-12-12",
          "marketCapitalization": 3285555.2, // Note: Value might be scaled
          "shareOutstanding": 15334.08,
          "logo": "https://static.finnhub.io/logo/...",
          "phone": "14089961010",
          "weburl": "https://www.apple.com/",
          "finnhubIndustry": "Technology",
          // Custom added fields (if applicable, from profile2)
          "ceo": "Timothy Donald Cook",
          "sector": "Technology",
          "employees": 164000,
          "address": "1 Apple Park Way",
          "city": "Cupertino",
          "state": "CA",
          // ... other fields like description, cik, etc.
        }
        ```

*   **`GET /api/stock/av-candles?symbol={symbol}`**
    *   **Purpose:** Fetches recent intraday (60min) candlestick data from Alpha Vantage. This is the primary source for charts on the detail page.
    *   **Handler:** `app/api/stock/av-candles/route.ts`
    *   **Library Function:** `lib/alphaVantage.ts -> getAVIntraday(symbol)`
    *   **Request:** Requires `symbol` query parameter.
    *   **Response Body (Example):** Array of `Candle` objects
        ```json
        [
          {
            "time": 1718989200, // UNIX Timestamp (UTC)
            "open": 213.5,
            "high": 214.8,
            "low": 213.0,
            "close": 214.2,
            "volume": 1500000
          },
          // ... more candle objects sorted by time
        ]
        ```
        *(Note: This format is after parsing by `parseAVSeries` in `alphaVantage.ts`)*

*   **`GET /api/stock/peers?symbol={symbol}`**
    *   **Purpose:** Fetches a list of peer company symbols.
    *   **Handler:** `app/api/stock/peers/route.ts`
    *   **Library Function:** `lib/finnhub.ts -> getPeers(symbol)`
    *   **Request:** Requires `symbol` query parameter.
    *   **Response Body (Example):** Array of peer symbols
        ```json
        ["MSFT", "GOOGL", "AMZN", "META", ...]
        ```

*   **`GET /api/stock/list`**
    *   **Purpose:** Fetches combined quote and simplified history data for a predefined list of stocks (currently AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA). Used by the main page.
    *   **Handler:** `app/api/stock/list/route.ts`
    *   **Library Functions:** `lib/finnhub.ts -> getQuote`, `lib/alphaVantage.ts -> getAVIntraday`
    *   **Request:** No parameters required.
    *   **Response Body (Example):** Array of `StockListItem` objects
        ```json
        [
          {
            "symbol": "AAPL",
            "price": 214.29,
            "change": 0.5018, // Percent change
            "history": [210.5, 211.1, 212.5, ..., 214.29] // Array of recent close prices
          },
          // ... other stock objects
        ]
        ```

*   **`GET /api/stock/search?q={query}`**
    *   **Purpose:** Searches for stock symbols matching the query.
    *   **Handler:** `app/api/stock/search/route.ts`
    *   **Library Function:** `lib/finnhub.ts -> lookupSymbols(q)`
    *   **Request:** Requires `q` query parameter (search term).
    *   **Response Body (Example):** Finnhub Search Result
        ```json
        {
          "count": 3,
          "result": [
            {
              "description": "APPLE INC",
              "displaySymbol": "AAPL",
              "symbol": "AAPL",
              "type": "Common Stock"
            },
            {
              "description": "APPLE HOSPITALITY REIT INC",
              "displaySymbol": "APLE",
              "symbol": "APLE",
              "type": "REIT"
            },
            // ... more results
          ]
        }
        ```

*   **`GET /api/stock/news?category={category}`**
    *   **Purpose:** Fetches general market news. Defaults to 'general' category if none provided.
    *   **Handler:** `app/api/stock/news/route.ts`
    *   **Library Function:** `lib/finnhub.ts -> getMarketNews(category)`
    *   **Request:** Optional `category` query parameter (e.g., `?category=technology`).
    *   **Response Body (Example):** Array of Finnhub News objects
        ```json
        [
          {
            "category": "technology",
            "datetime": 1718990000, // Timestamp
            "headline": "Tech stocks rally...",
            "id": 12345,
            "image": "https://url.to/image.jpg",
            "related": "AAPL",
            "source": "NewsSource",
            "summary": "Summary of the news article...",
            "url": "https://url.to/news/article"
          },
          // ... more news items
        ]
        ```

*   **`GET /api/stock/company-news?symbol={symbol}&from={YYYY-MM-DD}&to={YYYY-MM-DD}`**
    *   **Purpose:** Fetches news articles specifically related to a company within a date range.
    *   **Handler:** `app/api/stock/company-news/route.ts`
    *   **Library Function:** `lib/finnhub.ts -> getCompanyNews(symbol, from, to)`
    *   **Request:** Requires `symbol`, `from` (start date), and `to` (end date) query parameters.
    *   **Response Body (Example):** Array of Finnhub News objects (similar structure to market news).

*   **`GET /api/stock/candles?symbol={symbol}&resolution={res}&from={ts}&to={ts}`**
    *   **Purpose:** Fetches historical candlestick data from Finnhub. (Note: Comment in code suggests this might be premium-only and `/api/stock/av-candles` is preferred).
    *   **Handler:** `app/api/stock/candles/route.ts`
    *   **Library Function:** `lib/finnhub.ts -> getCandles(...)`
    *   **Request:** Requires `symbol`, `resolution` (e.g., 'D', '60'), `from` (Unix timestamp), and `to` (Unix timestamp) query parameters.
    *   **Response Body (Example):** Finnhub Candle Object
        ```json
        {
          "c": [214.2, 215.1, ...], // Array of close prices
          "h": [214.8, 215.5, ...], // Array of high prices
          "l": [213.0, 214.9, ...], // Array of low prices
          "o": [213.5, 215.0, ...], // Array of open prices
          "s": "ok", // Status
          "t": [1718989200, 1718992800, ...], // Array of timestamps
          "v": [1500000, 1800000, ...] // Array of volumes
        }
        ```

### `components/`
Contains reusable React components.

*   **`chart/CandlestickChart.tsx`**: A sophisticated chart component using the `lightweight-charts` library to display stock data. It can render both candlestick and line charts, handles resizing, and allows customization of colors. It expects data in the `Candle[]` format (`{ time, open, high, low, close, volume }`).
*   **`chart/Sparkline.tsx`**: A simpler chart component, likely also using `lightweight-charts`, designed to show a minimal line chart (e.g., for the stock list on the main page).
*   **`layout/Header.tsx`, `layout/Sidebar.tsx`**: Components defining the main application header (likely containing search, navigation) and sidebar (potentially for navigation or displaying watchlists).
*   **`ui/`**: Contains components based on the shadcn/ui library (e.g., `Button`, `Card`, `Input`, `Tabs`). These provide foundational UI elements.
*   **`theme-provider.tsx`**: Manages application theming (e.g., light/dark mode) using `next-themes`.

### `lib/`
Contains helper modules and logic for interacting with external services or performing utility tasks.

*   **`alphaVantage.ts`**: Handles all communication with the Alpha Vantage API.
    *   Uses multiple API keys (`ALPHA_VANTAGE_API_KEY`, `ALPHA_VANTAGE_API_KEY2`, ...) for rotation to mitigate rate limits.
    *   Implements Redis caching (`fetchAVWithCache`) to store API responses for a default of 24 hours, reducing API usage and speeding up responses. Requires a `REDIS_URL` environment variable. Caching can be disabled with `DISABLE_REDIS_CACHE=true`.
    *   Provides `getAVIntraday` to fetch 60min data and `parseAVSeries` to format it.
*   **`finnhub.ts`**: Handles all communication with the Finnhub API.
    *   Requires the `FINNHUB_API_KEY` environment variable.
    *   Uses a `fetchWithCache` helper that leverages Next.js's built-in `fetch` caching (`revalidate`).
    *   Exports functions for specific Finnhub endpoints (quote, profile, peers, news, candles, search).
*   **`api.ts`**: Contains client-side helper functions for calling the backend API routes defined in `app/api/`. Currently includes `fetchStockList`.
*   **`utils.ts`**: Contains utility functions, notably `cn` for merging Tailwind CSS classes.

### `hooks/`
Contains custom React hooks.

*   **`use-mobile.ts`**: A hook to determine if the application is being viewed on a mobile-sized screen, likely based on window width.

### Configuration Files
Standard configuration files for Next.js, TypeScript, Tailwind CSS, ESLint, etc.

*   **`next.config.ts`**: Configures Next.js behavior (e.g., environment variables, image handling).
*   **`tailwind.config.ts`**: Configures Tailwind CSS, including custom themes, colors, and plugins.
*   **`tsconfig.json`**: Configures TypeScript compiler options.
*   **`package.json`**: Lists project dependencies and scripts (`dev`, `build`, `start`, `lint`).

## Getting Started

Follow the original instructions in this README (if still present below this section) or standard Next.js procedures:

1.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
2.  **Set up environment variables:** Create a `.env.local` file in the `frontend` directory and add the required API keys and configurations:
    ```env
    # Finnhub API Key (Required)
    FINNHUB_API_KEY=your_finnhub_api_key

    # Alpha Vantage API Keys (Required for charts - add as many as you have)
    ALPHA_VANTAGE_API_KEY=your_av_key_1
    ALPHA_VANTAGE_API_KEY2=your_av_key_2
    # ... add more keys ALPHA_VANTAGE_API_KEY3, etc.

    # Base URL for the frontend application (Required for API calls from client/server components)
    # During development, this is usually http://localhost:3000
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # Redis URL for caching Alpha Vantage responses (Optional but recommended)
    # Defaults to 'redis://localhost:6379' if not set
    # Example: redis://:your_redis_password@your_redis_host:your_redis_port
    REDIS_URL=your_redis_connection_string

    # Disable Redis caching (Optional) - Set to 'true' to disable
    # DISABLE_REDIS_CACHE=true
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.