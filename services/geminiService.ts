import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MediaItem, MediaType, CategorySection } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for generating media items strictly
const mediaItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Title in Arabic" },
    description: { type: Type.STRING, description: "Short description in Arabic" },
    type: { type: Type.STRING, enum: ["movie", "series"] },
    rating: { type: Type.NUMBER, description: "Rating from 1 to 10" },
    year: { type: Type.INTEGER },
    genre: { type: Type.ARRAY, items: { type: Type.STRING } },
    isVip: { type: Type.BOOLEAN }
  },
  required: ["title", "description", "type", "rating", "year", "genre", "isVip"]
};

const categorySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Category title in Arabic" },
          items: {
            type: Type.ARRAY,
            items: mediaItemSchema
          }
        },
        required: ["title", "items"]
      }
    }
  },
  required: ["sections"]
};

export const fetchDashboardContent = async (): Promise<CategorySection[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a list of 3 content sections for a streaming app like Shahid. 1. Trending Arabic Series, 2. New Egyptian Movies, 3. Global Hits (dubbed). Each section should have 4-5 items. Ensure titles and descriptions are in Arabic. Be creative with titles.",
      config: {
        responseMimeType: "application/json",
        responseSchema: categorySchema,
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Post-process to add image URLs (simulated)
    if (data.sections) {
      return data.sections.map((section: any, secIndex: number) => ({
        ...section,
        items: section.items.map((item: any, itemIndex: number) => ({
          ...item,
          id: `gen-${secIndex}-${itemIndex}`,
          // Using picsum seeds to keep images consistent across re-renders
          imageUrl: `https://picsum.photos/seed/${item.title.replace(/\s/g, '')}/300/450`,
          backdropUrl: `https://picsum.photos/seed/${item.title.replace(/\s/g, '')}bg/1280/720`,
        }))
      }));
    }
    return [];
  } catch (error) {
    console.error("Gemini fetch error:", error);
    // Fallback data in case of API error or quota limits
    return [
      {
        title: "الأكثر مشاهدة هذا الأسبوع",
        items: [
          {
            id: "fb-1",
            title: "ليالي القاهرة",
            description: "دراما اجتماعية تدور في شوارع القاهرة القديمة.",
            type: MediaType.SERIES,
            rating: 9.2,
            year: 2024,
            genre: ["دراما", "إثارة"],
            imageUrl: "https://picsum.photos/seed/cairo/300/450",
            backdropUrl: "https://picsum.photos/seed/cairobg/1280/720",
            isVip: true
          },
          {
            id: "fb-2",
            title: "الصقر",
            description: "فيلم أكشن ومغامرات في الصحراء.",
            type: MediaType.MOVIE,
            rating: 8.5,
            year: 2023,
            genre: ["أكشن"],
            imageUrl: "https://picsum.photos/seed/falcon/300/450",
            backdropUrl: "https://picsum.photos/seed/falconbg/1280/720",
            isVip: false
          }
        ]
      }
    ];
  }
};

export const getAIRecommendation = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `User asks: "${query}". You are a helpful assistant for a streaming service called Shahid VIP. Recommend a fictional or real movie/series that fits the mood in Arabic. Keep it short (max 50 words).`,
    });
    return response.text || "عذراً، لم أتمكن من العثور على توصية مناسبة.";
  } catch (error) {
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
  }
};
