import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export const MODEL_NAME = "gemini-3-flash-preview";

export const getGeminiModel = (modelName: string = MODEL_NAME) => {
    return genAI.getGenerativeModel({ model: modelName });
};
