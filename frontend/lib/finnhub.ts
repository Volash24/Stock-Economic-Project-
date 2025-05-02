import axios from 'axios';

const token = process.env.FINNHUB_API_KEY;
const client = axios.create({
  baseURL: 'https://finnhub.io/api/v1',
  params: { token },
});
console.log('Testing quote…', await client.get('/quote', { params: { symbol: 'AAPL' } }));

export const lookupSymbols = (q: string) =>
  client.get('/search', { params: { q } }).then(res => res.data);

export const getCompanyProfile = (symbol: string) =>
  client.get('/stock/profile2', { params: { symbol } }).then(res => res.data);

export const getQuote = (symbol: string) =>
  client.get('/quote', { params: { symbol } }).then(res => res.data);

export const getPeers = (symbol: string) =>
  client.get('/stock/peers', { params: { symbol } }).then(res => res.data);

export const getCandles = (
  symbol: string,
  resolution: string,
  from: number,
  to: number
) =>
  client
    .get('/stock/candle', { params: { symbol, resolution, from, to } })
    .then(res => res.data);

export const getMarketNews = (category: string) =>
  client.get('/news', { params: { category } }).then(res => res.data);

export const getCompanyNews = (
  symbol: string,
  from: string,
  to: string
) =>
  client
    .get('/company-news', { params: { symbol, from, to } })
    .then(res => res.data);
