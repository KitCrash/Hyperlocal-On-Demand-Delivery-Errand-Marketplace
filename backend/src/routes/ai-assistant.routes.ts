import { Router } from 'express';
import { parseMultilingualOrderText, combineAndDeduplicateItems, ExtractedItem } from '../services/aiParser.js';

const router = Router();

// Sample multilingual prompts for quick testing in UI
const SAMPLE_PROMPTS = {
  bengali: [
    '2 Desi red onions, 1 kg potatoes and 250g green chillies',
    '1 kg sliced Rohu fish and 1 packet Amul milk',
    '6 country eggs and 1 litre mustard oil',
  ],
  hindi: [
    'दो किलो नासिक प्याज, एक किलो आलू और आधा किलो टमाटर',
    'एक पैकेट आशीर्वाद आटा और दो लीटर अमुल दूध',
    'एक स्ट्रिप डोलो 650 और आधा किलो हरी मिर्च',
  ],
  english: [
    '2 kg onions, 1 kg fresh potatoes and 500g tomatoes',
    '1 packet Fortune mustard oil and 5kg Aashirvaad atta',
    '1 plate Kolkata mutton biryani and 1 bottle cold water',
  ],
  imageSamples: [
    {
      title: 'Handwritten Morning Mandi Note',
      extractedText: '1. Onion 2kg\n2. Potato 1kg\n3. Green Chilli 250g\n4. Fresh Country Eggs 6pcs',
      imagePreview: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=500',
    },
    {
      title: 'Weekly Kirana Store List',
      extractedText: 'Mustard oil 1L\nAtta 5kg\nAmul Milk 2 packets\nTomatoes 1kg',
      imagePreview: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
    },
  ],
};

// GET /api/ai/sample-prompts
router.get('/sample-prompts', (req, res) => {
  res.json({ samples: SAMPLE_PROMPTS });
});

// POST /api/ai/parse-voice
router.post('/parse-voice', async (req, res): Promise<void> => {
  try {
    const { transcript, language } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'Transcript string is required' });
      return;
    }

    const items = await parseMultilingualOrderText(transcript, 'VOICE');

    res.json({
      language: language || 'detected',
      rawTranscript: transcript,
      extractedCount: items.length,
      items,
    });
  } catch (error: any) {
    console.error('AI Voice parse error:', error);
    res.status(500).json({ error: 'Failed to parse voice order', details: error.message });
  }
});

// POST /api/ai/parse-image
router.post('/parse-image', async (req, res): Promise<void> => {
  try {
    const { imageText, imageUrl, imageBase64, mimeType = 'image/jpeg' } = req.body;

    // Use Gemini Vision API if imageBase64 and GEMINI_API_KEY are available
    const apiKey = process.env.GEMINI_API_KEY;
    if (imageBase64 && apiKey) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: 'Extract all shopping/errand items from this image (handwritten or printed). Return ONLY a valid JSON array of objects with fields: name (string), quantity (number, default 1), unit (string, e.g. "kg", "g", "pack", "piece"), estimatedPrice (number in INR, default 40). No markdown, no extra text.',
                    },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: cleanBase64,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (geminiRes.ok) {
          const data: any = await geminiRes.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonMatch = rawText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsedItems = JSON.parse(jsonMatch[0]).map((item: any) => ({
              name: String(item.name || 'Item'),
              quantity: Number(item.quantity) || 1,
              unit: String(item.unit || 'unit'),
              estimatedPrice: Number(item.estimatedPrice) || 40,
              inputMethod: 'IMAGE_OCR',
              confidenceScore: 0.95,
              uncertaintyFlag: false,
            }));
            res.json({
              imageUrl,
              extractedText: rawText,
              extractedCount: parsedItems.length,
              items: parsedItems,
              provider: 'gemini-2.5-flash',
            });
            return;
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini OCR fallback triggered:', geminiErr);
      }
    }

    // Fallback: Use imageText if provided from frontend OCR/canvas or sample
    const textToProcess = imageText || '1kg Onion, 1kg Potato, 250g Green Chilli';

    const items = await parseMultilingualOrderText(textToProcess, 'IMAGE_OCR');

    res.json({
      imageUrl,
      extractedText: textToProcess,
      extractedCount: items.length,
      items,
    });
  } catch (error: any) {
    console.error('AI Image parse error:', error);
    res.status(500).json({ error: 'Failed to parse image order', details: error.message });
  }
});

// POST /api/ai/combine-deduplicate
// Combines manual items, voice items, and image items into a unified, confirmed list
router.post('/combine-deduplicate', async (req, res): Promise<void> => {
  try {
    const { manualItems = [], voiceItems = [], imageItems = [] } = req.body;

    const rawCombined: ExtractedItem[] = [
      ...manualItems.map((item: any) => ({ ...item, inputMethod: 'MANUAL' })),
      ...voiceItems.map((item: any) => ({ ...item, inputMethod: 'VOICE' })),
      ...imageItems.map((item: any) => ({ ...item, inputMethod: 'IMAGE_OCR' })),
    ];

    const deduplicated = combineAndDeduplicateItems(rawCombined);

    // Calculate total estimated cost
    const estimatedTotal = deduplicated.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
    const uncertainItemsCount = deduplicated.filter((i) => i.uncertaintyFlag).length;
    const mergedDuplicatesCount = deduplicated.filter((i) => i.isDuplicateMerged).length;

    res.json({
      totalItems: deduplicated.length,
      estimatedTotal: Math.round(estimatedTotal * 100) / 100,
      uncertainItemsCount,
      mergedDuplicatesCount,
      requiresConfirmation: true, // Always require customer confirmation!
      items: deduplicated,
    });
  } catch (error: any) {
    console.error('Combine items error:', error);
    res.status(500).json({ error: 'Failed to combine and deduplicate items', details: error.message });
  }
});

export default router;
