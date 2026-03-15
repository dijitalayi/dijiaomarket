import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const items = searchParams.get('items');
    const location = searchParams.get('location') || 'BlackMarket';
    const timeScale = searchParams.get('time-scale') || '24';

    if (!items) {
        return NextResponse.json({ error: 'Items parameter is required' }, { status: 400 });
    }

    try {
        // Albion Data Project History API
        const url = `https://www.albion-online-data.com/api/v2/stats/history/${items}.json?locations=${location}&time-scale=${timeScale}`;
        
        const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
        const data = await response.json();
        
        // Simplify data: Map item_id to total item_count in the given period
        const volumeMap = {};
        data.forEach(entry => {
            const totalVolume = entry.data.reduce((sum, d) => sum + (d.item_count || 0), 0);
            volumeMap[entry.item_id] = totalVolume;
        });

        return NextResponse.json(volumeMap);
    } catch (error) {
        console.error('History API error:', error);
        return NextResponse.json({ error: 'Failed to fetch history data' }, { status: 500 });
    }
}
