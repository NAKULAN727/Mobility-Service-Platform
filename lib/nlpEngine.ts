"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NLPResponse, ChatContext, NLPEntities } from "../types/chat";

export async function processChatWithNLP(
  message: string,
  context: ChatContext
): Promise<NLPResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Convert previous messages to text context for Gemini
  const chatHistory = context.messages
    .slice(-5) // Keep last 5 messages for context
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const currentEntities = JSON.stringify(context.currentEntities, null, 2);

  const prompt = `You are DriveMate AI, a premium Smart Driver & Mobility assistant coordinating an end-to-end booking workflow.

Analyze the user's message and perform the following tasks:
1. Identify the user's intent. Possible intents: BookRide, ConfirmBooking, SubmitReview, CancelRide, FareEstimation, FAQ, Greeting.
2. Extract booking entities (pickup, destination, date, time, passengers, priority, specialRequests, reviewText).
3. Detect the 'serviceType' STRICTLY as either "DRIVER_ONLY" or "CAR_WITH_DRIVER". 
   - If the user implies they have their own car (e.g. "I have my own car", "feeling tired to drive", "need a driver"), set serviceType to "DRIVER_ONLY".
   - If the user implies they need a car or a complete ride (e.g. "need a ride to the airport", "cab"), set serviceType to "CAR_WITH_DRIVER".
4. If intent is BookRide and you cannot confidently determine the serviceType, leave serviceType null and add "serviceType" to missingFields.
5. Generate a conversational response. If serviceType is missing, ask: "Do you already have your own vehicle, or would you like DriveMate to provide one?".

Currently Known Entities:
${currentEntities}

Recent Chat History:
${chatHistory}

Current User Message:
${message}

Return ONLY valid JSON in the exact structure below. Do not use markdown blocks like \`\`\`json.
{
  "intent": "",
  "entities": {
    "pickup": "",
    "destination": "",
    "date": "",
    "time": "",
    "serviceType": null,
    "passengers": 1,
    "priority": "",
    "specialRequests": "",
    "reviewText": ""
  },
  "missingFields": [],
  "response": ""
}`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed: NLPResponse = JSON.parse(text);

    // Normalize empty strings to null for entities to avoid false positives
    for (const key in parsed.entities) {
      if (parsed.entities[key as keyof NLPEntities] === "") {
        (parsed.entities as any)[key] = null;
      }
    }

    return parsed;
  } catch (error) {
    console.error("NLP Engine Error, falling back to rule-based parser:", error);
    return fallbackNLP(message, context);
  }
}

function fallbackNLP(message: string, context: ChatContext): NLPResponse {
  const msg = message.toLowerCase().trim();
  
  const response: NLPResponse = {
    intent: "FAQ",
    entities: {
      pickup: context.currentEntities?.pickup || null,
      destination: context.currentEntities?.destination || null,
      date: context.currentEntities?.date || null,
      time: context.currentEntities?.time || null,
      serviceType: context.currentEntities?.serviceType || null,
      passengers: context.currentEntities?.passengers || 1,
      priority: context.currentEntities?.priority || null,
      specialRequests: context.currentEntities?.specialRequests || null,
      reviewText: null
    },
    missingFields: [],
    response: "I'm sorry, I couldn't fully understand your request. Could you please rephrase it?"
  };

  // 1. SubmitReview Intent (If the workflow is currently TRIP_COMPLETED)
  if (context.workflowState?.currentStep === "TRIP_COMPLETED") {
    response.intent = "SubmitReview";
    response.entities.reviewText = message;
    response.response = "Thank you for your feedback! Parsing review...";
    return response;
  }

  // 2. ConfirmBooking Intent
  const isConfirm = msg.includes("confirm") || msg.includes("yes") || msg.includes("ok") || msg.includes("sure") || msg.includes("yep") || msg.includes("agree");
  if (context.workflowState?.currentStep === "MATCHING" && isConfirm) {
    response.intent = "ConfirmBooking";
    response.response = "Confirming your booking now...";
    return response;
  }

  // 3. BookRide Intent
  const fromToMatch = message.match(/(?:from\s+)?([^to]+?)\s+to\s+(.+)/i);
  const isBook = msg.includes("book") || msg.includes("ride") || msg.includes("taxi") || msg.includes("cab") || fromToMatch;

  if (isBook) {
    response.intent = "BookRide";
    
    let pickup = context.currentEntities?.pickup;
    let destination = context.currentEntities?.destination;

    if (fromToMatch) {
      pickup = fromToMatch[1].replace(/book\s+a\s+ride\s+from\s+/i, "").replace(/book\s+ride\s+from\s+/i, "").replace(/from\s+/i, "").trim();
      destination = fromToMatch[2].trim();
    }

    response.entities.pickup = pickup || null;
    response.entities.destination = destination || null;

    const missing = [];
    if (!response.entities.pickup) missing.push("pickup");
    if (!response.entities.destination) missing.push("destination");

    if (!response.entities.serviceType) missing.push("serviceType");

    response.missingFields = missing;
    
    if (missing.includes("serviceType")) {
      response.response = "Do you already have your own vehicle, or would you like DriveMate to provide one?";
    } else if (missing.length > 0) {
      response.response = `To book a ride, I need your ${missing.join(" and ")}. Please provide them (e.g. from Delhi to Mumbai).`;
    } else {
      const mode = response.entities.serviceType === "DRIVER_ONLY" ? "Driver Only" : "Car + Driver";
      response.response = `Booking your ${mode} service from ${response.entities.pickup} to ${response.entities.destination}...`;
    }
    return response;
  }

  return response;
}

