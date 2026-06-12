"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ReviewAnalysis } from "../types/review";

export async function analyzeReview(reviewText: string): Promise<ReviewAnalysis> {
  if (!reviewText || reviewText.trim() === "") {
    throw new Error("Review text cannot be empty.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an AI sentiment analysis assistant.

Analyze the following customer review.

Return ONLY valid JSON.

{
  "sentiment": "",
  "confidence": 0,
  "keywords": [],
  "summary": ""
}

Rules:
- sentiment must be Positive, Neutral, or Negative
- confidence must be between 0 and 1
- keywords should contain 3-5 important words
- summary should be under 25 words

Review:
${reviewText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting from Gemini
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsedData = JSON.parse(cleanedText);
    
    // Validate the sentiment structure
    const sentiment = parsedData.sentiment;
    if (!["Positive", "Neutral", "Negative"].includes(sentiment)) {
      throw new Error("Invalid sentiment returned by AI.");
    }

    const analysis: ReviewAnalysis = {
      review: reviewText,
      sentiment: sentiment as "Positive" | "Neutral" | "Negative",
      confidence: parsedData.confidence || 0,
      keywords: parsedData.keywords || [],
      summary: parsedData.summary || "No summary provided."
    };

    return analysis;
  } catch (error) {
    console.error("Gemini API Error during sentiment analysis:", error);
    throw new Error("Unable to analyze review at the moment. Please try again later.");
  }
}
