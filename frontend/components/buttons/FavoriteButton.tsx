'use client';

import { useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import { addFavoriteStock, removeFavoriteStock } from '@/lib/actions/favorites';
import { Button } from '@/components/ui/button'; // Assuming Button component exists
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface FavoriteButtonProps {
    stockSymbol: string;
    initialIsFavorite: boolean;
    className?: string;
}

export function FavoriteButton({ stockSymbol, initialIsFavorite, className }: FavoriteButtonProps) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isPending, startTransition] = useTransition();

    const handleClick = () => {
        startTransition(async () => {
            try {
                if (isFavorite) {
                    const result = await removeFavoriteStock(stockSymbol);
                    if (result.success) {
                        setIsFavorite(false);
                    } else {
                        // Handle error (e.g., show a toast notification)
                        console.error('Failed to remove favorite:', result.message);
                    }
                } else {
                    const result = await addFavoriteStock(stockSymbol);
                    if (result.success) {
                        setIsFavorite(true);
                    } else {
                         // Handle error (e.g., show a toast notification)
                        console.error('Failed to add favorite:', result.message);
                    }
                }
            } catch (error) {
                 // Handle unexpected errors
                console.error('Error toggling favorite:', error);
            }
        });
    };

    return (
        <Button
            variant="ghost" // Use ghost or outline variant for less emphasis
            size="icon"
            onClick={handleClick}
            disabled={isPending}
            className={cn('transition-colors', className)}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Star
                className={cn(
                    'h-5 w-5',
                    isFavorite ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground',
                    isPending ? 'animate-pulse' : ''
                )}
            />
        </Button>
    );
} 