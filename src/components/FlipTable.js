"use client";

import React from 'react';

/**
 * Renders a row for a flip opportunity.
 */
const FlipRow = ({ item, city, buyPrice, sellPrice, profit, roi, quality, bmQuality, volume, updatedAt, safetyScore, onAddToCart }) => {
    // Albion Image API URL
    const iconUrl = `https://render.albiononline.com/v1/item/${item.unique_name}.png?size=64`;

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

    const formatTimeAgo = (date) => {
        if (!date || date.getFullYear() === 1) return 'N/A';
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <tr>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={iconUrl} alt={item.localized_name} className="item-icon" />
                    <div> {/* This div now correctly wraps the text content */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', color: 'var(--accent-parchment)' }}>
                            {item.localized_name}
                            {safetyScore && (
                                <span 
                                    className="safety-dot" 
                                    style={{ 
                                        background: safetyScore === 3 ? '#2ecc71' : safetyScore === 2 ? '#f1c40f' : '#e74c3c',
                                        boxShadow: `0 0 8px ${safetyScore === 3 ? '#2ecc71' : safetyScore === 2 ? '#f1c40f' : '#e74c3c'}`
                                    }}
                                    title={safetyScore === 3 ? 'Safe (Fres & Liquid)' : safetyScore === 2 ? 'Caution (Stale/Low ROI)' : 'Risky (No Volume)'}
                                ></span>
                            )}
                        </div>
                        <div style={{ fontSize: '0.60rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.unique_name}
                            <button 
                                onClick={() => onAddToCart({item, city, profit, roi, volume, buyPrice, sellPrice, quality, bmQuality})}
                                className="add-cart-btn"
                                title="Add to Transport Cart"
                            >
                                <span className="material-icons" style={{ fontSize: '14px' }}>add</span>
                            </button>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{city}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Quality: {getQualityName(quality)}</div>
            </td>
            <td>
                <div style={{ color: 'var(--text-primary)' }}>{buyPrice.toLocaleString()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>City Price</div>
            </td>
            <td>
                <div style={{ color: 'var(--accent-gold)' }}>{sellPrice.toLocaleString()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Min Quality: {getQualityName(bmQuality)}</div>
            </td>
            <td>
                <div style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                    {volume !== undefined ? volume.toLocaleString() : '...'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>24h Volume</div>
            </td>
            <td>
                <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-icons" style={{ fontSize: '14px', opacity: 0.6 }}>schedule</span>
                    {formatTimeAgo(updatedAt)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Data Age</div>
            </td>
            <td>
                <div>
                    <div className={profit > 0 ? "profit-text" : "loss-text"}>
                        {profit > 0 ? "+" : ""}{profit.toLocaleString()}
                    </div>
                    <div className="profit-bar-container">
                        <div
                            className="profit-bar"
                            style={{ width: `${Math.min(roi, 100)}%`, opacity: roi > 0 ? 1 : 0.3 }}
                        ></div>
                    </div>
                </div>
            </td>
            <td style={{ textAlign: 'right' }}>
                <div className={profit > 0 ? "profit-text" : "loss-text"} style={{ fontSize: '1.1rem' }}>
                    %{roi}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ROI</div>
            </td>
        </tr>
    );
};

export default function FlipTable({ flips, loading, onSort, sortConfig, onAddToCart }) {
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <span className="material-icons" style={{ fontSize: '14px', opacity: 0.3 }}>unfold_more</span>;
        }
        return sortConfig.direction === 'desc'
            ? <span className="material-icons" style={{ fontSize: '14px', color: 'var(--accent-gold)' }}>expand_more</span>
            : <span className="material-icons" style={{ fontSize: '14px', color: 'var(--accent-gold)' }}>expand_less</span>;
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div className="live-indicator"></div> Loading...
        </div>;
    }

    if (!flips || flips.length === 0) {
        return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Start by searching for an item or use the filters to see opportunities.
        </div>;
    }

    const SortableHeader = ({ label, sortKey, icon, align = 'left' }) => (
        <th
            onClick={() => onSort(sortKey)}
            style={{
                cursor: 'pointer',
                textAlign: align,
                padding: '12px 15px',
                userSelect: 'none',
                transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
                <span className="material-icons" style={{ fontSize: '18px', opacity: 0.7 }}>{icon}</span>
                <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
                {renderSortIcon(sortKey)}
            </div>
        </th>
    );

    return (
        <div className="albion-card" style={{ padding: '0' }}>
            <table className="albion-table">
                <thead>
                    <tr>
                        <SortableHeader label="Item info" sortKey="item" icon="unarchive" />
                        <SortableHeader label="City" sortKey="city" icon="place" />
                        <SortableHeader label="City Price" sortKey="buyPrice" icon="add_shopping_cart" />
                        <SortableHeader label="BM Price" sortKey="sellPrice" icon="sell" />
                        <SortableHeader label="Volume" sortKey="volume" icon="inventory_2" />
                        <SortableHeader label="Updated" sortKey="updatedAt" icon="history" />
                        <SortableHeader label="Profit" sortKey="profit" icon="currency_exchange" />
                        <SortableHeader label="ROI" sortKey="roi" icon="trending_up" align="right" />
                    </tr>
                </thead>
                <tbody>
                    {flips.map((flip, index) => (
                        <FlipRow
                            key={`${flip.item.unique_name}-${flip.city}-${flip.quality}-${index}`}
                            item={flip.item}
                            city={flip.city}
                            buyPrice={flip.buyPrice}
                            sellPrice={flip.sellPrice}
                            quality={flip.quality}
                            bmQuality={flip.bmQuality}
                            volume={flip.volume}
                            updatedAt={flip.updatedAt}
                            profit={flip.profit}
                            roi={flip.roi}
                            safetyScore={flip.safetyScore}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
