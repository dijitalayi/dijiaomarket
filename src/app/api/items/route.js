import { NextResponse } from 'next/server';
import filteredItems from '@/data/items_filtered.json';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const tier = searchParams.get('tier');
    let results = filteredItems;

    if (query) {
        results = results.filter(item => 
            item.localized_name.toLowerCase().includes(query) || 
            item.unique_name.toLowerCase().includes(query)
        );
    }

    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? results.length : parseInt(limitParam || '100');

    if (tier) {
        results = results.filter(item => item.unique_name.startsWith(`T${tier}_`));
    }

    // Return the results
    return NextResponse.json(results.slice(0, limit));
}
