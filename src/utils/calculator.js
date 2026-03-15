/**
 * Albion Online Profit Calculator
 * Accounts for Premium/Non-Premium Tax and Market Setup Fees.
 */

export const TAX_RATES = {
    PREMIUM: 0.04,    // 4% Sales Tax
    NON_PREMIUM: 0.08, // 8% Sales Tax
    SETUP_FEE: 0.015  // 1.5% Setup Fee (Approx)
};

/**
 * Calculates net profit for a flip from a city to Black Market.
 * 
 * @param {number} buyPrice - The price you pay in the source city.
 * @param {number} sellPrice - The price you sell for at the Black Market.
 * @param {boolean} isPremium - Whether the user has active Premium status.
 * @returns {object} - { netProfit, roiPercentage, totalFees }
 */
export function calculateFlipProfit(buyPrice, sellPrice, isPremium = true) {
    if (!buyPrice || !sellPrice) {
        return { netProfit: 0, roi: 0, fees: 0 };
    }

    const salesTaxRate = isPremium ? TAX_RATES.PREMIUM : TAX_RATES.NON_PREMIUM;
    
    // Total fees include the setup fee (at buy or sell depending on order type)
    // For Black Market flip, we usually sell to a Buy Order (Instant Sell) or list a Sell Order.
    // If we Sell to Buy Order: Sales Tax applied, no setup fee.
    // If we list Sell Order: Sales Tax + Setup Fee applied.
    // We'll assume Sell Order for maximum profit calculation but include the setup fee.
    
    const fees = (sellPrice * salesTaxRate) + (sellPrice * TAX_RATES.SETUP_FEE);
    const netProfit = sellPrice - fees - buyPrice;
    const roi = buyPrice > 0 ? (netProfit / buyPrice) * 100 : 0;

    return {
        netProfit: Math.floor(netProfit),
        roi: parseFloat(roi.toFixed(2)),
        fees: Math.floor(fees)
    };
}
