'use server';

// Import getServerSession for server-side session retrieval in v4
import { getServerSession } from 'next-auth/next'; 
// Import the *exported AuthOptions object*, not the GET handler
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 
import { prisma } from '@/lib/prisma'; // Correct named import
import { revalidatePath } from 'next/cache';
import { Session } from 'next-auth'; // Import Session type

// Define an interface for the expected shape of the decoded JWT payload
interface DecodedJwtPayload {
    id?: string;
    name?: string;
    email?: string;
    image?: string; // Use 'image' as NextAuth typically uses 'picture' claim by default
    picture?: string; // Include picture just in case
    sub?: string; // Standard JWT subject claim
    iat?: number;
    exp?: number;
    jti?: string;
    // Add other properties if you added them in the jwt callback
}

// Helper function to get user session using getServerSession
async function getUserSession() {
    console.log('Attempting to get session with authOptions:', authOptions ? 'Exists' : 'Missing');
    const sessionData = await getServerSession(authOptions);
    console.log('getServerSession returned (raw):', JSON.stringify(sessionData, null, 2));

    // Type assertion after checking if sessionData is not null
    if (!sessionData) {
         throw new Error('User session not found.');
    }

    // The session object should conform to the Session interface from next-auth
    const session = sessionData as Session; // Use the correct Session type

    // Check for the id directly on the session.user object
    if (!session?.user?.id) {
        console.log('Session details (missing user or user.id):', JSON.stringify(session, null, 2));
        throw new Error('User not authenticated or session missing ID');
    }

    // Return an object containing the essential user info, including the ID
    return {
        id: session.user.id, // Access id from session.user
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null, // Access image from session.user
    };
}

/**
 * Fetches the favorite stock symbols for the authenticated user.
 * @returns {Promise<string[]>} A promise that resolves to an array of stock symbols.
 */
export async function getFavoriteStocks(): Promise<string[]> {
    try {
        const user = await getUserSession();
        const favorites = await prisma.favoriteStock.findMany({
            where: { userId: user.id },
            select: { stockSymbol: true },
        });
        return favorites.map((fav: { stockSymbol: string }) => fav.stockSymbol);
    } catch (error) {
        console.error('Error fetching favorite stocks:', error);
        // Depending on your error handling strategy, you might return an empty array
        // or re-throw the error for the caller to handle.
        return [];
    }
}

/**
 * Adds a stock to the authenticated user's favorites.
 * @param {string} stockSymbol - The symbol of the stock to favorite.
 * @returns {Promise<{success: boolean, message?: string}>} A promise indicating success or failure.
 */
export async function addFavoriteStock(stockSymbol: string): Promise<{success: boolean, message?: string}> {
     if (!stockSymbol) {
        return { success: false, message: 'Stock symbol cannot be empty.' };
    }
    try {
        const user = await getUserSession();
        await prisma.favoriteStock.create({
            data: {
                userId: user.id,
                stockSymbol: stockSymbol.toUpperCase(), // Store symbols consistently
            },
        });
        // Revalidate pages that might display favorites
        revalidatePath('/(protected)'); // Revalidate the main stock list page layout/group
        revalidatePath('/(protected)/favorites'); // Revalidate the favorites page
        return { success: true };
    } catch (error: any) {
        console.error(`Error adding favorite stock ${stockSymbol}:`, error);
         // Handle potential unique constraint violation (already favorited) gracefully
        if (error.code === 'P2002') { // Prisma unique constraint violation code
             return { success: false, message: `${stockSymbol} is already in favorites.` };
        }
        return { success: false, message: 'Failed to add favorite.' };
    }
}

/**
 * Removes a stock from the authenticated user's favorites.
 * @param {string} stockSymbol - The symbol of the stock to unfavorite.
 * @returns {Promise<{success: boolean, message?: string}>} A promise indicating success or failure.
 */
export async function removeFavoriteStock(stockSymbol: string): Promise<{success: boolean, message?: string}> {
     if (!stockSymbol) {
        return { success: false, message: 'Stock symbol cannot be empty.' };
    }
    try {
        const user = await getUserSession();
        await prisma.favoriteStock.deleteMany({ // Use deleteMany in case of unexpected duplicates, though unique constraint should prevent this.
            where: {
                userId: user.id,
                stockSymbol: stockSymbol.toUpperCase(),
            },
        });
         // Revalidate relevant pages
        revalidatePath('/(protected)');
        revalidatePath('/(protected)/favorites');
        return { success: true };
    } catch (error) {
        console.error(`Error removing favorite stock ${stockSymbol}:`, error);
        return { success: false, message: 'Failed to remove favorite.' };
    }
} 