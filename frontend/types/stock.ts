export interface Stock {
  symbol: string;
  price: number;
  change: number;
  history: Array<[timestamp: number, price: number]>;
}

export interface StockInfo {
  symbol: string;
  price: number;
  change: number;
}
