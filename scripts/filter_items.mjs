import fs from 'fs';
import path from 'path';

const INPUT_PATH = 'c:/Users/dijitalayi/Desktop/AlbionOnlineData/Data_Json/items.json';
const OUTPUT_DIR = './src/data';
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'items_filtered.json');

async function filterItems() {
    try {
        console.log('Reading items.json...');
        const rawData = fs.readFileSync(INPUT_PATH, 'utf-8');
        const items = JSON.parse(rawData);

        console.log('Filtering items...');
        
        // Patterns for Black Market items: Armor, Weapons, Bags, Capes (T4 to T8)
        // We exclude food, potions, mounts (though mounts can be in BM, user focused on gear enchants)
        // The user specifically mentioned enchants (.1, .2, .3, .4) which apply to gear.
        
        const gearKeywords = [
            '_HEAD_', '_SHOES_', '_ARMOR_', '_MAIN_', '_OFF_', '_2H_', 
            '_CAPE', '_BAG', '_BACKPACK'
        ];

        const itemMap = new Map();

        for (const item of items) {
            const name = item.unique_name;
            
            const tierMatch = name.match(/^T([4-8])_/);
            if (!tierMatch) continue;

            const isGear = gearKeywords.some(kw => name.includes(kw));
            if (!isGear) continue;

            // Add the item from source
            itemMap.set(name, item);

            // If it's a base item (no @), generate variants if they don't exist
            if (!name.includes('@')) {
                for (let e = 1; e <= 4; e++) {
                    const enchantName = `${name}@${e}`;
                    if (!itemMap.has(enchantName)) {
                        itemMap.set(enchantName, {
                            unique_name: enchantName,
                            localized_name: `${item.localized_name} (.${e})`,
                            index: `${item.index}_${e}`
                        });
                    }
                }
            }
        }

        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const filtered = Array.from(itemMap.values());
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filtered, null, 2));
        console.log(`Success! Saved ${filtered.length} unique items to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('Error filtering items:', error);
    }
}

filterItems();
