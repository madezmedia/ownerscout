const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface AIAnalysisResult {
    vibe: string;
    targetAudience: string;
    usp: string;
    ownerFitScore: number;
    fitReason: string;
    suggestedPitch: string;
}

export const analyzeRestaurant = async (
    name: string,
    website: string,
    description?: string,
    rating?: number
): Promise<AIAnalysisResult> => {
    if (!GEMINI_API_KEY) {
        console.warn("Missing GEMINI_API_KEY");
        return getMockAnalysis(name);
    }

    const prompt = `
    Analyze this restaurant for a sales prospect list for Owner.com (online ordering & marketing platform for independent restaurants).
    
    Restaurant: ${name}
    Website: ${website}
    Description: ${description || "N/A"}
    Rating: ${rating || "N/A"}

    Task:
    1. Determine the "Vibe" (3-5 words, e.g., "Upscale Romantic Italian").
    2. Identify the Target Audience.
    3. Find the Unique Selling Point (USP).
    4. Estimate "Associate Fit Score" (0-100) based on independence, need for better tech, and online presence.
       - High score if: Independent, good food but bad website, no online ordering, or using expensive 3rd party apps.
       - Low score if: Corporate chain, already has custom app, or very low rating.
    5. Write a 1-sentence reason for the score.
    6. Write a 1-sentence "Icebreaker Pitch" for a sales call.

    Output pure JSON:
    {
        "vibe": "...",
        "targetAudience": "...",
        "usp": "...",
        "ownerFitScore": 0,
        "fitReason": "...",
        "suggestedPitch": "..."
    }
    `;

    try {
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error("No response from AI");

        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        return getMockAnalysis(name);
    }
};

const getMockAnalysis = (name: string): AIAnalysisResult => ({
    vibe: "Cozy Neighborhood Gem",
    targetAudience: "Local Families & Couples",
    usp: "Authentic family recipes since 1995",
    ownerFitScore: 85,
    fitReason: "Strong local following but outdated digital presence.",
    suggestedPitch: `I noticed ${name} has great reviews for the food, but your online ordering setup might be costing you commissions.`
});
