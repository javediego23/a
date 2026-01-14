import { getGeminiModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const model = getGeminiModel();
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ success: true, message: text });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to connect to Gemini API", details: String(error) },
            { status: 500 }
        );
    }
}
