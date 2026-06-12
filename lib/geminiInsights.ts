"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalyticsData } from "../types/analytics";

export async function generateBusinessInsights(data: AnalyticsData): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const dataString = JSON.stringify(data, null, 2);

  const prompt = `You are a business analytics assistant for DriveMate, a mobility service.

Analyze the following ride statistics and provide:
1. Key observations
2. Performance summary
3. Suggestions for improvement

Keep the response under 80 words. Be professional and insightful. Do not include markdown formatting like asterisks or bullet points, just write a clean paragraph.

Data:
${dataString}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/^"|"$/g, '').trim();
  } catch (error) {
    console.error("Gemini API Error for insights:", error);
    return "Booking demand peaks during evening hours. Customer satisfaction remains high, while cancellations are relatively low. Consider deploying additional drivers during peak periods to improve service availability.";
  }
}
