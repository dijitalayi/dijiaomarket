"use client";

import React, { useState } from 'react';

export default function SmartCart({ items, onRemove, onClear }) {
    const [isOpen, setIsOpen] = useState(false);

    const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);

    if (items.length === 0) return null;

    return (
        <div className="smart-cart-container" style={{ transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 50px))' }}>
            <div className="smart-cart-header" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons" style={{ color: 'var(--accent-gold)' }}>shopping_cart</span>
                    <span style={{ fontWeight: 'bold', fontFamily: 'Ubuntu' }}>Smart Cart ({items.length})</span>
                </div>
                <span className="material-icons">{isOpen ? 'expand_more' : 'expand_less'}</span>
            </div>

            <div className="smart-cart-body">
                {items.map((item) => (
                    <div key={item.cartId} className="cart-item">
                        <img
                            src={`https://render.albiononline.com/v1/item/${item.item.unique_name}.png?size=32`}
                            alt={item.item.localized_name}
                            style={{ width: '32px', height: '32px' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--accent-parchment)' }}>
                                {item.item.localized_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {item.city} - {item.profit > 0 ? `+${item.profit.toLocaleString()}` : item.profit.toLocaleString()} Silver
                            </div>
                        </div>
                        <button className="remove-item-btn" onClick={() => onRemove(item.cartId)}>
                            <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                        </button>
                    </div>
                ))}
            </div>

            <div className="smart-cart-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Expected Profit:</span>
                    <span style={{ color: 'var(--profit-green)', fontWeight: 'bold' }}>{totalProfit.toLocaleString()} Silver</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="albion-button"
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)' }}
                        onClick={onClear}
                    >
                        Clear All
                    </button>
                    <button
                        className="albion-button"
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', background: 'var(--accent-gold)', color: '#000' }}
                        onClick={() => {
                            const list = items.map(i => `${i.item.localized_name} (${i.city}): ${i.profit} Silver`).join('\n');
                            navigator.clipboard.writeText(list);
                            alert('Transport list copied to clipboard!');
                        }}
                    >
                        Copy List
                    </button>
                </div>
            </div>
        </div>
    );
}
