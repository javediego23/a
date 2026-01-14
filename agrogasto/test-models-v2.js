
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.5-pro-001",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-2.0-flash-exp" // We know this works but 429s
    ];

    console.log("Testing models for availability...");

    for (const modelName of modelsToTest) {
        try {
            console.log(`Testing [${modelName}]...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            // Use a very short prompt to minimize token usage
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ SUCCESS: [${modelName}] is available! Response: ${response.text().substring(0, 20)}...`);
        } catch (e) {
            const msg = e.message.split('\n')[0];
            if (msg.includes("429")) {
                console.log(`⚠️  RATE LIMITED: [${modelName}] (This model exists but is busy/capped)`);
            } else if (msg.includes("404")) {
                console.log(`❌ NOT FOUND: [${modelName}] (Does not exist for this API version/key)`);
            } else {
                console.log(`❌ ERROR: [${modelName}] ${msg}`);
            }
        }
    }
}

listModels();
