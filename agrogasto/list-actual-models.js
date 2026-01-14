
const apiKey = process.env.GEMINI_API_KEY;
require('dotenv').config({ path: '.env.local' });

async function getModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("No API Key");
        return;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        if (data.models) {
            console.log("--- AVAILABLE MODELS ---");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`Name: ${m.name}`);
                    console.log(`DisplayName: ${m.displayName}`);
                    console.log(`-`.repeat(20));
                }
            });
        } else {
            console.log("No models found in response:", data);
        }

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

getModels();
