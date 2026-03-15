import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const items = searchParams.get('items'); // Comma separated unique names
    const locations = searchParams.get('locations') || 'Lymhurst,Fort Sterling,Thetford,Martlock,Bridgewatch,Caerleon,Black Market';
    const qualities = searchParams.get('qualities') || '0'; // 0 = All qualities (Normal to Masterpiece)

    if (!items) {
        return NextResponse.json({ error: 'Items parameter is required' }, { status: 400 });
    }

    try {
        const apiUrl = `https://www.albion-online-data.com/api/v2/stats/prices/${items}?locations=${locations}&qualities=${qualities}`;
        
        const response = await fetch(apiUrl, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });

        if (!response.ok) {
            throw new Error(`Albion API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching Albion prices:', error);
        return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
    }
}
