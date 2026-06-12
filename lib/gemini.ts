import { GoogleGenerativeAI } from "@google/generative-ai";

export async function parseBooking(userInput: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an intelligent booking assistant.

Extract booking information from the user's request.

Return ONLY valid JSON.

{
  "pickup": "",
  "destination": "",
  "date": "",
  "time": "",
  "rideType": "",
  "passengers": "",
  "specialRequests": ""
}

If information is missing, return null for that field.

User Request: "${userInput}"`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

export async function getGeminiReason(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    // Remove any formatting like surrounding quotes that Gemini might add
    return response.text().replace(/^"|"$/g, '').trim();
  } catch (error) {
    console.error("Gemini API Error for explanation:", error);
    throw error;
  }
}

export async function getFareExplanation(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().replace(/^"|"$/g, '').trim();
  } catch (error) {
    console.error("Gemini API Error for fare explanation:", error);
    throw error;
  }
}
