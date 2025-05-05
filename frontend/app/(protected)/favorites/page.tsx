import { getFavoriteStocks } from '@/lib/actions/favorites';
import { Suspense } from 'react';
import { fetchStockList } from '@/lib/api'; // Import the function used in dashboard
// import StockCard from '@/components/StockCard'; // Assuming you have a component to display stock info
// import { fetchStockDataBatch } from '@/lib/stock-api'; // Assuming you have a function to fetch stock data
import Link from 'next/link';
import { Sparkline } from "@/components/chart/Sparkline";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";
import { FavoriteButton } from "@/components/buttons/FavoriteButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components

async function FavoriteStocksList() {
    const favoriteSymbols = await getFavoriteStocks();

    if (favoriteSymbols.length === 0) {
        return <p className="text-center text-gray-500 mt-8">You haven&apos;t favorited any stocks yet.</p>;
    }

    // Fetch all stock data (similar to dashboard)
    const allStocksData = await fetchStockList(favoriteSymbols);

    // Filter the data to include only favorited stocks
    const favoriteStocksData = allStocksData.filter(stock =>
        favoriteSymbols.includes(stock.symbol)
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteStocksData.map(stock => (
                 <Card key={stock.symbol}>
                     <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                         <CardTitle className="text-lg font-semibold">
                           <Link href={`/stocks/${stock.symbol}`} className="hover:underline">
                               {stock.symbol}
                           </Link>
                         </CardTitle>
                         <FavoriteButton
                           stockSymbol={stock.symbol}
                           initialIsFavorite={true}
                         />
                     </CardHeader>
                     <CardContent className="space-y-3">
                       <div className="flex justify-between items-center">
                         <span className="text-2xl font-medium">${stock.price.toFixed(2)}</span>
                         <Badge variant={stock.change > 0 ? "success" : "destructive"} className="text-xs">
                             {stock.change > 0 ? (
                                 <ArrowUp className="h-3 w-3 mr-1" />
                             ) : (
                                <ArrowDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(stock.change).toFixed(2)}%
                         </Badge>
                       </div>
                       <div className="w-full h-16"> 
                           <Sparkline data={stock.history} color={stock.change > 0 ? "#22c55e" : "#ef4444"} />
                       </div>
                     </CardContent>
                 </Card>
            ))}
        </div>
    );
}

export default function FavoritesPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Your Favorite Stocks</h1>
             <Suspense fallback={<div className="flex justify-center items-center h-40"><p>Loading favorites...</p></div>}> {/* Improved loading state styling */}
                <FavoriteStocksList />
            </Suspense>
        </div>
    );
}
