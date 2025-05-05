import { getFavoriteStocks } from '@/lib/actions/favorites';
import { Suspense } from 'react';
import { fetchStockList } from '@/lib/api'; // Import the function used in dashboard
// import StockCard from '@/components/StockCard'; // Assuming you have a component to display stock info
// import { fetchStockDataBatch } from '@/lib/stock-api'; // Assuming you have a function to fetch stock data

async function FavoriteStocksList() {
    const favoriteSymbols = await getFavoriteStocks();

    if (favoriteSymbols.length === 0) {
        return <p className="text-center text-gray-500 mt-8">You haven't favorited any stocks yet.</p>;
    }

    // Fetch all stock data (similar to dashboard)
    const allStocksData = await fetchStockList();

    // Filter the data to include only favorited stocks
    const favoriteStocksData = allStocksData.filter(stock =>
        favoriteSymbols.includes(stock.symbol)
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {favoriteStocksData.map(stock => (
                 <div key={stock.symbol} className="border p-4 rounded shadow">
                    <h3 className="text-lg font-semibold">{stock.symbol}</h3>
                    <p>Price: {stock.price}</p>
                    {/* Add your StockCard or other display logic here */}
                     {/* You might want to add the favorite star here too, already filled */}
                </div>
            ))}
        </div>
    );
}

export default function FavoritesPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Your Favorite Stocks</h1>
             <Suspense fallback={<p className="text-center mt-8">Loading favorites...</p>}>
                <FavoriteStocksList />
            </Suspense>
        </div>
    );
}
