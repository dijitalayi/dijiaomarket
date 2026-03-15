"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import FlipTable from '@/components/FlipTable';
import SmartCart from '@/components/SmartCart';
import { calculateFlipProfit } from '@/utils/calculator';

const CITIES = ['Lymhurst', 'Fort Sterling', 'Thetford', 'Martlock', 'Bridgewatch'];

export default function Home() {
    const [selectedCity, setSelectedCity] = useState('Lymhurst');
    const [tier, setTier] = useState('4');
    const [isPremium, setIsPremium] = useState(true);

    const [flips, setFlips] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'roi', direction: 'desc' });
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [isScanning, setIsScanning] = useState(false);
    const [minProfit, setMinProfit] = useState(20000); // Default threshold
    const [minRoi, setMinRoi] = useState(25);        // Default ROI threshold
    const [cart, setCart] = useState([]);           // Smart Cart

    // Using a ref to stop scanning if needed
    const scanRef = useRef(false);

    // Dynamic sorting logic
    const applySort = (data, config) => {
        return [...data].sort((a, b) => {
            let aVal, bVal;

            switch (config.key) {
                case 'item': aVal = a.item.localized_name; bVal = b.item.localized_name; break;
                case 'city': aVal = a.city; bVal = b.city; break;
                case 'buyPrice': aVal = a.buyPrice; bVal = b.buyPrice; break;
                case 'sellPrice': aVal = a.sellPrice; bVal = b.sellPrice; break;
                case 'profit': aVal = a.profit; bVal = b.profit; break;
                case 'roi': aVal = a.roi; bVal = b.roi; break;
                case 'volume': aVal = a.volume || 0; bVal = b.volume || 0; break;
                case 'updatedAt': aVal = a.ageMs; bVal = b.ageMs; break;
                default: return 0;
            }

            if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        const newConfig = { key, direction };
        setSortConfig(newConfig);
        setFlips(prev => applySort(prev, newConfig));
    };

    const addToCart = (flip) => {
        setCart(prev => [...prev, { ...flip, cartId: Date.now() + Math.random() }]);
    };

    const removeFromCart = (cartId) => {
        setCart(prev => prev.filter(item => item.cartId !== cartId));
    };

    const getQualityName = (q) => {
        const qualities = {
            1: 'Normal',
            2: 'Good',
            3: 'Outstanding',
            4: 'Excellent',
            5: 'Masterpiece'
        };
        return qualities[q] || 'Normal';
    };

    const startScan = async () => {
        if (isScanning) {
            scanRef.current = false;
            setIsScanning(false);
            return;
        }

        setIsScanning(true);
        setLoading(true);
        setFlips([]);
        scanRef.current = true;

        try {
            // 1. Fetch ALL items for the selected tier
            const res = await fetch(`/api/items?tier=${tier}&limit=all`);
            const allItems = await res.json();

            setProgress({ current: 0, total: allItems.length });

            // 2. Batching logic (100 items per request)
            const batchSize = 100;
            const batches = [];
            for (let i = 0; i < allItems.length; i += batchSize) {
                batches.push(allItems.slice(i, i + batchSize));
            }

            let allFlips = [];

            for (let i = 0; i < batches.length; i++) {
                if (!scanRef.current) break; // Stop if scan cancelled

                const batch = batches[i];
                const itemIds = batch.map(item => item.unique_name).join(',');

                try {
                    const priceRes = await fetch(`/api/prices?items=${itemIds}&locations=${selectedCity},Black Market`);
                    const priceData = await priceRes.json();

                    // Process this batch for flips (now handles qualities and timestamps)
                    const batchFlips = processBatch(batch, priceData);

                    if (batchFlips.length > 0) {
                        try {
                            const profitableIds = [...new Set(batchFlips.map(f => f.item.unique_name))].join(',');
                            const volumeRes = await fetch(`/api/history?items=${profitableIds}&location=BlackMarket&time-scale=24`);
                            const volumeData = await volumeRes.json();

                            batchFlips.forEach(flip => {
                                flip.volume = volumeData[flip.item.unique_name] || 0;

                                // Calculate Safety Score (User Refinement: 1/8/9 rule)
                                // 1: Red (Riskli), 2: Yellow (Belirsiz), 3: Green (Güvenli)
                                let score = 2; // Default Yellow
                                const ageLimit = 24 * 60 * 60 * 1000;

                                if (flip.volume <= 1) {
                                    score = 1; // Red: Riskli (Hacim <= 1 veya satış yok)
                                } else if (flip.volume >= 9 && flip.ageMs <= ageLimit && flip.roi >= 20) {
                                    score = 3; // Green: Güvenli (Hacim >= 9 + Taze + ROI >= 20)
                                } else {
                                    score = 2; // Yellow: Belirsiz (Hacim 2-8 arası veya veri stale/düşük ROI)
                                }
                                flip.safetyScore = score;
                            });
                        } catch (volErr) {
                            console.error('Volume fetch error:', volErr);
                        }
                    }

                    // Add all flips (filtering will happen in render)
                    allFlips = [...allFlips, ...batchFlips];

                    // Sort and update UI incrementally
                    setFlips(applySort(allFlips, sortConfig));
                    setProgress(prev => ({ ...prev, current: prev.current + batch.length }));

                } catch (err) {
                    console.error('Batch error:', err);
                }
            }

        } catch (error) {
            console.error('Scan error:', error);
        } finally {
            setIsScanning(false);
            setLoading(false);
        }
    };

    const processBatch = (items, prices) => {
        const batchFlips = [];
        const now = new Date();

        items.forEach(item => {
            const itemPrices = prices.filter(p => p.item_id === item.unique_name);
            const bmPrices = itemPrices.filter(p => p.city === 'Black Market');
            const cityPrices = itemPrices.filter(p => p.city === selectedCity);

            if (bmPrices.length === 0 || cityPrices.length === 0) return;

            // Find best flip across all quality combinations
            cityPrices.forEach(cityP => {
                if (cityP.sell_price_min === 0) return;

                bmPrices.forEach(bmP => {
                    if (bmP.buy_price_max === 0) return;

                    // Black Market Buy Order accepts quality X or higher. 
                    if (cityP.quality < bmP.quality) return;

                    const buyPrice = cityP.sell_price_min;
                    const sellPrice = bmP.buy_price_max;

                    const { netProfit, roi } = calculateFlipProfit(buyPrice, sellPrice, isPremium);

                    // Use oldest date for 'Updated' column safety
                    const cityDate = new Date(cityP.sell_price_min_date);
                    const bmDate = new Date(bmP.buy_price_max_date);
                    const oldestDate = cityDate < bmDate ? cityDate : bmDate;

                    batchFlips.push({
                        item,
                        city: selectedCity,
                        buyPrice,
                        sellPrice,
                        profit: netProfit,
                        roi,
                        quality: cityP.quality,
                        bmQuality: bmP.quality,
                        updatedAt: oldestDate,
                        ageMs: oldestDate.getFullYear() === 1 ? Infinity : (now - oldestDate)
                    });
                });
            });
        });

        // Deduplicate: same item/city -> keep highest profit
        const uniqueFlips = [];
        const seen = new Set();
        const sortedBatch = [...batchFlips].sort((a, b) => b.profit - a.profit);

        sortedBatch.forEach(flip => {
            const key = `${flip.item.unique_name}-${flip.city}`;
            if (!seen.has(key)) {
                uniqueFlips.push(flip);
                seen.add(key);
            }
        });

        return uniqueFlips;
    };

    return (
        <main style={{ padding: '40px', maxWidth: '1320px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <img src="/favicon.png" alt="Logo" style={{ width: '80px', height: '80px' }} />
                    Albion Black Market v1
                </h1>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className={`live-indicator ${isScanning ? 'scanning' : ''}`}></span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {isScanning ? `Scanning in Progress... (%${Math.round((progress.current / progress.total) * 100) || 0})` : 'System Ready'}
                        </span>
                    </div>
                </div>
            </header>

            <section className="albion-card" style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', fontFamily: 'Ubuntu', fontSize: '0.8rem' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>location_on</span> City
                        </label>
                        <div className="albion-select-wrapper">
                            <select
                                className="albion-button albion-select"
                                style={{ width: '100%' }}
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                disabled={isScanning}
                            >
                                {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', fontFamily: 'Ubuntu', fontSize: '0.8rem' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>layers</span> Tier
                        </label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {['4', '5', '6', '7', '8'].map(t => (
                                <button
                                    key={t}
                                    className={`albion-button ${tier === t ? 'active' : ''}`}
                                    onClick={() => setTier(t)}
                                    style={{ padding: '8px 15px' }}
                                    disabled={isScanning}
                                >
                                    T{t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', fontFamily: 'Ubuntu', fontSize: '0.8rem' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>verified</span> Premium Status(Tax)
                        </label>
                        <button
                            className={`albion-button ${isPremium ? 'active' : ''}`}
                            onClick={() => setIsPremium(!isPremium)}
                            disabled={isScanning}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isPremium ? (
                                <><span className="material-icons" style={{ fontSize: '18px', color: 'var(--border-gold)' }}>diamond</span> PREMIUM (%4)</>
                            ) : (
                                <><span className="material-icons" style={{ fontSize: '18px', opacity: 0.5 }}>do_not_disturb_on</span> STANDART (%8)</>
                            )}
                        </button>
                    </div>

                    <div style={{ flex: '0 0 140px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', fontFamily: 'Ubuntu', fontSize: '0.8rem' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>payments</span> Min Profit
                        </label>
                        <input
                            type="number"
                            className="albion-button"
                            style={{ width: '100%', textAlign: 'left', background: 'rgba(0,0,0,0.3)', cursor: 'text' }}
                            value={minProfit}
                            onChange={(e) => setMinProfit(Number(e.target.value))}
                        />
                    </div>

                    <div style={{ flex: '0 0 100px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px', fontFamily: 'Ubuntu', fontSize: '0.8rem' }}>
                            <span className="material-icons" style={{ fontSize: '16px' }}>trending_up</span> Min ROI %
                        </label>
                        <input
                            type="number"
                            className="albion-button"
                            style={{ width: '100%', textAlign: 'left', background: 'rgba(0,0,0,0.3)', cursor: 'text' }}
                            value={minRoi}
                            onChange={(e) => setMinRoi(Number(e.target.value))}
                        />
                    </div>

                    <div>
                        <button
                            className="albion-button"
                            onClick={startScan}
                            style={{
                                background: isScanning ? '#8b0000' : 'var(--accent-gold)',
                                color: isScanning ? '#fff' : '#000',
                                minWidth: '200px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span className="material-icons" style={{ fontSize: '20px' }}>
                                {isScanning ? 'block' : 'search'}
                            </span>
                            {isScanning ? 'STOP SEARCH' : 'SEARCH'}
                        </button>
                    </div>
                </div>

                {isScanning && (
                    <div className="profit-bar-container" style={{ marginTop: '20px', height: '4px' }}>
                        <div
                            className="profit-bar"
                            style={{ width: `${(progress.current / progress.total) * 100}%`, transition: 'width 0.3s ease' }}
                        ></div>
                    </div>
                )}
            </section>

            {/* Active Listing */}
            <FlipTable
                flips={flips.filter(f => f.profit >= minProfit && f.roi >= minRoi)}
                loading={loading}
                onSort={handleSort}
                sortConfig={sortConfig}
                onAddToCart={addToCart}
            />

            <SmartCart
                items={cart}
                onRemove={removeFromCart}
                onClear={() => setCart([])}
            />

            <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                All equipment and variations within the selected Tier are scanned. Data is added to the list in real-time.
            </footer>
        </main>
    );
}
