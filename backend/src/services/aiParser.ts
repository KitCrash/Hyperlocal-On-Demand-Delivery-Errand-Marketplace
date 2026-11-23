import prisma from '../prisma.js';

export interface ExtractedItem {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  inputMethod: 'MANUAL' | 'VOICE' | 'IMAGE_OCR';
  confidenceScore: number;
  uncertaintyFlag?: string | null;
  category?: string;
  imageUrl?: string;
  isDuplicateMerged?: boolean;
  mergedFrom?: string[];
}

// Bengali numerals & words to numbers
const BENGALI_NUMBERS: Record<string, number> = {
  'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'দশ': 10,
  'আধ': 0.5, 'আধা': 0.5, 'দেড়': 1.5, 'আড়াই': 2.5,
  '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9, '১০': 10,
};

// Hindi numerals & words to numbers
const HINDI_NUMBERS: Record<string, number> = {
  'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'आधा': 0.5, 'डेढ़': 1.5, 'ढाई': 2.5, 'पाव': 0.25,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
};

// Standard english word numbers
const ENGLISH_NUMBERS: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'half': 0.5, 'quarter': 0.25,
};

/**
 * Intelligent Multilingual Natural Language parser for Voice and Text transcripts
 * Supports Bengali, Hindi, English, and Hinglish/Banglish transliterations
 */
export async function parseMultilingualOrderText(
  rawText: string,
  inputMethod: 'VOICE' | 'IMAGE_OCR' = 'VOICE'
): Promise<ExtractedItem[]> {
  const allProducts = await prisma.product.findMany({
    include: { store: true },
  });

  const extractedItems: ExtractedItem[] = [];

  // Split text by common separators: comma, newline, 'and', 'আর', 'এবং', 'aur', 'aur bhi'
  const phrases = rawText
    .split(/[,;\n\r]|(?:\b(?:and|aur|evam|also)\b)|(?:[,\s]+(?:আর|এবং|aur|aur bhi)[,\s]+)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);

  for (const phrase of phrases) {
    let cleanPhrase = phrase.toLowerCase();

    // Check for quantity
    let quantity = 1;
    let unit = 'piece';
    let matchedUnit = false;

    // Unit detection
    if (/(?:kg|kilo|kilos|কেজি|किलो)/i.test(cleanPhrase)) {
      unit = 'kg';
      matchedUnit = true;
    } else if (/(?:gm|g|gram|grams|গ্রাম|ग्राम)/i.test(cleanPhrase)) {
      unit = 'g';
      matchedUnit = true;
    } else if (/(?:litre|liter|l|ltr|লিটার|लीटर)/i.test(cleanPhrase)) {
      unit = 'litre';
      matchedUnit = true;
    } else if (/(?:packet|pkt|প্যাকেট|पैकेट|pouch)/i.test(cleanPhrase)) {
      unit = 'packet';
      matchedUnit = true;
    } else if (/(?:strip|পাতা|पत्ता)/i.test(cleanPhrase)) {
      unit = 'strip';
      matchedUnit = true;
    } else if (/(?:dozen|ডজন|दर्जन)/i.test(cleanPhrase)) {
      unit = 'dozen';
      matchedUnit = true;
    } else if (/(?:pcs|piece|pieces|টা|টি|नग|पीस)/i.test(cleanPhrase)) {
      unit = 'piece';
      matchedUnit = true;
    }

    // Number extraction: digits
    const digitMatch = cleanPhrase.match(/(\d+(?:\.\d+)?)/);
    if (digitMatch) {
      quantity = parseFloat(digitMatch[1]);
      // Normalize if in grams e.g. 500g -> 0.5kg or keep unit '500g'
      if (unit === 'g' && quantity >= 100) {
        // e.g. 500 g or 250 g
        unit = `${quantity}g`;
        quantity = 1;
      }
    } else {
      // Check word numerals
      for (const [w, val] of Object.entries(BENGALI_NUMBERS)) {
        if (cleanPhrase.includes(w)) {
          quantity = val;
          break;
        }
      }
      for (const [w, val] of Object.entries(HINDI_NUMBERS)) {
        if (cleanPhrase.includes(w)) {
          quantity = val;
          break;
        }
      }
      for (const [w, val] of Object.entries(ENGLISH_NUMBERS)) {
        if (new RegExp(`\\b${w}\\b`, 'i').test(cleanPhrase)) {
          quantity = val;
          break;
        }
      }
    }

    // Now find the best product match in catalog
    let bestProduct: any = null;
    let highestScore = 0;

    for (const prod of allProducts) {
      let score = 0;
      const prodName = prod.name.toLowerCase();
      const prodBn = prod.nameBengali?.toLowerCase() || '';
      const prodHi = prod.nameHindi?.toLowerCase() || '';

      // Check keywords
      const keywords = [
        ...prodName.split(/[\s,()\-]+/).filter((w) => w.length > 2),
        ...prodBn.split(/[\s,()\-]+/).filter((w) => w.length > 1),
        ...prodHi.split(/[\s,()\-]+/).filter((w) => w.length > 1),
      ];

      for (const kw of keywords) {
        if (cleanPhrase.includes(kw)) {
          score += kw.length > 3 ? 3 : 1;
        }
      }

      // Special transliteration boosts
      if (
        (cleanPhrase.includes('onion') || cleanPhrase.includes('pyaaj') || cleanPhrase.includes('piyaj') || cleanPhrase.includes('পেঁয়াজ')) &&
        prodName.includes('Onion')
      ) score += 10;

      if (
        (cleanPhrase.includes('potato') || cleanPhrase.includes('aalu') || cleanPhrase.includes('aloo') || cleanPhrase.includes('আলু')) &&
        prodName.includes('Potatoes')
      ) score += 10;

      if (
        (cleanPhrase.includes('tomato') || cleanPhrase.includes('tamatar') || cleanPhrase.includes('টমেটো')) &&
        prodName.includes('Tomatoes')
      ) score += 10;

      if (
        (cleanPhrase.includes('chilli') || cleanPhrase.includes('mirch') || cleanPhrase.includes('lanka') || cleanPhrase.includes('লঙ্কা')) &&
        prodName.includes('Chillies')
      ) score += 10;

      if (
        (cleanPhrase.includes('egg') || cleanPhrase.includes('dim') || cleanPhrase.includes('anda') || cleanPhrase.includes('ডিম')) &&
        prodName.includes('Eggs')
      ) score += 10;

      if (
        (cleanPhrase.includes('milk') || cleanPhrase.includes('dudh') || cleanPhrase.includes('doodh') || cleanPhrase.includes('দুধ')) &&
        prodName.includes('Milk')
      ) score += 10;

      if (
        (cleanPhrase.includes('oil') || cleanPhrase.includes('tel') || cleanPhrase.includes('সরষে')) &&
        prodName.includes('Oil')
      ) score += 10;

      if (
        (cleanPhrase.includes('fish') || cleanPhrase.includes('mach') || cleanPhrase.includes('rohu') || cleanPhrase.includes('মাছ')) &&
        prodName.includes('Fish')
      ) score += 10;

      if (
        (cleanPhrase.includes('atta') || cleanPhrase.includes('aata') || cleanPhrase.includes('flour') || cleanPhrase.includes('আটা')) &&
        prodName.includes('Atta')
      ) score += 10;

      if (
        (cleanPhrase.includes('biryani') || cleanPhrase.includes('বিরিয়ানি')) &&
        prodName.includes('Biryani')
      ) score += 10;

      if (
        (cleanPhrase.includes('dolo') || cleanPhrase.includes('paracetamol') || cleanPhrase.includes('ডলো')) &&
        prodName.includes('Dolo')
      ) score += 10;

      if (
        (cleanPhrase.includes('cauliflower') || cleanPhrase.includes('gobhi') || cleanPhrase.includes('fulkopi') || cleanPhrase.includes('ফুলকপি')) &&
        prodName.includes('Cauliflower')
      ) score += 10;

      // Hardware & Utility (Water pipe, Mug, Bucket, Tap)
      if (
        (cleanPhrase.includes('pipe') || cleanPhrase.includes('water pipe') || cleanPhrase.includes('পাইপ') || cleanPhrase.includes('पाइप')) &&
        prodName.includes('Pipe')
      ) score += 12;

      if (
        (cleanPhrase.includes('mug') || cleanPhrase.includes('water mug') || cleanPhrase.includes('মগ') || cleanPhrase.includes('मग')) &&
        prodName.includes('Mug')
      ) score += 12;

      if (
        (cleanPhrase.includes('bucket') || cleanPhrase.includes('balti') || cleanPhrase.includes('বালতি') || cleanPhrase.includes('बाल्टी')) &&
        prodName.includes('Bucket')
      ) score += 12;

      if (
        (cleanPhrase.includes('tap') || cleanPhrase.includes('faucet') || cleanPhrase.includes('কল') || cleanPhrase.includes('नल')) &&
        prodName.includes('Tap')
      ) score += 12;

      // Electrical & Lighting
      if (
        (cleanPhrase.includes('bulb') || cleanPhrase.includes('led') || cleanPhrase.includes('বাল্ব') || cleanPhrase.includes('बल्ब')) &&
        prodName.includes('Bulb')
      ) score += 12;

      if (
        (cleanPhrase.includes('extension') || cleanPhrase.includes('board') || cleanPhrase.includes('power strip') || cleanPhrase.includes('বোর্ড')) &&
        prodName.includes('Extension')
      ) score += 12;

      if (
        (cleanPhrase.includes('switch') || cleanPhrase.includes('socket') || cleanPhrase.includes('সুইচ') || cleanPhrase.includes('स्विच')) &&
        prodName.includes('Socket')
      ) score += 12;

      if (
        (cleanPhrase.includes('tape') || cleanPhrase.includes('insulation') || cleanPhrase.includes('টেপ') || cleanPhrase.includes('टेप')) &&
        prodName.includes('Tape')
      ) score += 12;

      if (
        (cleanPhrase.includes('tester') || cleanPhrase.includes('টেস্টার') || cleanPhrase.includes('टेस्टर')) &&
        prodName.includes('Tester')
      ) score += 12;

      // Clothing & Apparel
      if (
        (cleanPhrase.includes('tshirt') || cleanPhrase.includes('t-shirt') || cleanPhrase.includes('shirt') || cleanPhrase.includes('টি-শার্ট') || cleanPhrase.includes('टी-शर्ट')) &&
        prodName.includes('T-Shirt')
      ) score += 12;

      if (
        (cleanPhrase.includes('towel') || cleanPhrase.includes('gamcha') || cleanPhrase.includes('তোয়ালে') || cleanPhrase.includes('গামছা') || cleanPhrase.includes('तौलिया') || cleanPhrase.includes('गमछा')) &&
        prodName.includes('Towel')
      ) score += 12;

      if (
        (cleanPhrase.includes('shorts') || cleanPhrase.includes('pant') || cleanPhrase.includes('হাফ প্যান্ট') || cleanPhrase.includes('शॉर्ट्स')) &&
        prodName.includes('Shorts')
      ) score += 12;

      if (
        (cleanPhrase.includes('raincoat') || cleanPhrase.includes('poncho') || cleanPhrase.includes('রেইনকোট') || cleanPhrase.includes('रेनकोट')) &&
        prodName.includes('Raincoat')
      ) score += 12;

      if (score > highestScore) {
        highestScore = score;
        bestProduct = prod;
      }
    }

    // Determine confidence and uncertainty
    let confidence = 0.5;
    let uncertaintyFlag: string | null = null;

    if (bestProduct && highestScore >= 8) {
      confidence = 0.95;
    } else if (bestProduct && highestScore >= 3) {
      confidence = 0.78;
      uncertaintyFlag = `Matched "${bestProduct.name}". Please verify item variant.`;
    } else {
      confidence = 0.45;
      uncertaintyFlag = `Uncertain product match. Treated as custom errand/market request.`;
    }

    if (!matchedUnit) {
      uncertaintyFlag = uncertaintyFlag
        ? `${uncertaintyFlag} Defaulted unit to "${unit}".`
        : `Defaulted unit to "${unit}". Confirm if desired.`;
    }

    const itemName = bestProduct ? bestProduct.name : phrase.replace(/\b(?:\d+|kg|g|litre|packet|piece)\b/gi, '').trim() || phrase;
    const estPrice = bestProduct ? bestProduct.estimatedPrice * quantity : 50 * quantity;

    extractedItems.push({
      productId: bestProduct?.id,
      name: itemName,
      quantity,
      unit: bestProduct?.unit || unit,
      estimatedPrice: Math.round(estPrice * 100) / 100,
      inputMethod,
      confidenceScore: Math.round(confidence * 100) / 100,
      uncertaintyFlag,
      category: bestProduct?.category || 'Custom / Errand',
      imageUrl: bestProduct?.imageUrl || null,
    });
  }

  return extractedItems;
}

/**
 * Intelligent Deduplication & Combination Algorithm
 * Combines items from Manual, Voice, and Image OCR
 * Detects duplicate items, aggregates quantities, and flags for customer review
 */
export function combineAndDeduplicateItems(items: ExtractedItem[]): ExtractedItem[] {
  const mergedMap = new Map<string, ExtractedItem>();

  for (const item of items) {
    // Generate normalized key for comparison (by productId or lowercase normalized name)
    const normKey = item.productId
      ? `prod_${item.productId}`
      : `name_${item.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    if (mergedMap.has(normKey)) {
      const existing = mergedMap.get(normKey)!;
      // Merge quantities
      const combinedQty = existing.quantity + item.quantity;
      const combinedPrice = existing.estimatedPrice + item.estimatedPrice;
      const sources = new Set<string>();
      if (existing.mergedFrom) existing.mergedFrom.forEach((s) => sources.add(s));
      else sources.add(existing.inputMethod);
      sources.add(item.inputMethod);

      mergedMap.set(normKey, {
        ...existing,
        quantity: Math.round(combinedQty * 100) / 100,
        estimatedPrice: Math.round(combinedPrice * 100) / 100,
        isDuplicateMerged: true,
        mergedFrom: Array.from(sources),
        uncertaintyFlag: `Merged from ${Array.from(sources).join(' & ')}: Qty updated to ${combinedQty} ${existing.unit}. Please confirm before submitting.`,
      });
    } else {
      mergedMap.set(normKey, {
        ...item,
        isDuplicateMerged: false,
        mergedFrom: [item.inputMethod],
      });
    }
  }

  return Array.from(mergedMap.values());
}
