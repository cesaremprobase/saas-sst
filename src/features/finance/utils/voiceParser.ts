import Fuse from 'fuse.js';
import { Client, Product } from '../types';

interface ParseResult {
    clientId?: string;
    products: Record<string, number>;
    paymentAmount?: number;
    deliveryAmount?: number; // Optional manual override
    shift?: 'MORNING' | 'AFTERNOON';
}

export const parseVoiceCommand = (
    text: string,
    clients: Client[],
    products: Product[]
): ParseResult => {
    const result: ParseResult = {
        products: {}
    };

    const lowerText = text.toLowerCase();

    // 1. Detect Client
    // Strategy: Look for names in the text
    const clientFuse = new Fuse(clients, {
        keys: ['name', 'order_index'],
        threshold: 0.4, // Sensitivity
        includeScore: true
    });

    // We split text into chunks to find the best match for client
    // For simplicity, we search the whole text against client names
    // OR we can extract potential names. 
    // Optimization: Clients usually come first "Cliente Juan..."

    // Let's try matching the whole text first, or substrings
    // A better approach for "Client X": search for name occurrence
    const words = lowerText.split(' ');

    // Search for client matches in the text
    const clientMatch = clientFuse.search(lowerText)?.[0];
    if (clientMatch && clientMatch.score && clientMatch.score < 0.4) {
        result.clientId = clientMatch.item.id;
    }

    // 2. Detect Products and Quantities
    // Patterns: "5 panes", "10 bizcochos", "un keke"
    const productFuse = new Fuse(products, {
        keys: ['name'],
        threshold: 0.4
    });

    // Helper to extract number before a word
    const numberMap: Record<string, number> = {
        'un': 1, 'una': 1, 'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10
    };

    products.forEach(prod => {
        // Search if product name exists in text (fuzzy)
        const match = productFuse.search(lowerText).find(r => r.item.id === prod.id);

        if (match && match.score && match.score < 0.3) {
            // Product found, look for quantity before it
            // We need to find WHERE it was found in the text (approx)
            // Limitations of Fuse: doesn't give index easily for unstructured text
            // Fallback: Regex for exact/close name

            // Simple heuristic: Look for numbers in the text and see if they are close to the product name?
            // Better: Regex for "(\d+) (product_name)"

            // Let's iterate words. If we find a number, look ahead for product.
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                let qty = parseInt(word);
                if (isNaN(qty)) qty = numberMap[word] || 0;

                if (qty > 0) {
                    // Look ahead 1-2 words for product
                    const nextWords = words.slice(i + 1, i + 3).join(' ');
                    const prodMatch = productFuse.search(nextWords)?.[0];

                    if (prodMatch && prodMatch.item.id === prod.id && prodMatch.score! < 0.3) {
                        result.products[prod.name] = (result.products[prod.name] || 0) + qty;
                    }
                }
            }
        }
    });

    // 3. Detect Payment
    // Patterns: "pago 20", "abono 50", "cuenta 100"
    const paymentRegex = /(pago|abono|cuenta|acuenta)\s+(\d+(\.\d{1,2})?)/i;
    const paymentMatch = lowerText.match(paymentRegex);
    if (paymentMatch) {
        result.paymentAmount = parseFloat(paymentMatch[2]);
    }

    // 4. Detect Shift
    if (lowerText.includes('tarde') || lowerText.includes('noche')) {
        result.shift = 'AFTERNOON';
    } else if (lowerText.includes('mañana') || lowerText.includes('dia') || lowerText.includes('día')) {
        result.shift = 'MORNING';
    }

    return result;
};
