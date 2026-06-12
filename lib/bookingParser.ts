"use server";

import { parseBooking as parseWithGemini } from "./gemini";
import { Booking } from "../types/booking";

export async function parseBooking(userInput: string): Promise<Booking | null> {
  try {
    const jsonString = await parseWithGemini(userInput);
    
    if (!jsonString) {
      return null;
    }

    // Clean up potential markdown formatting from Gemini response
    const cleanedString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsedData = JSON.parse(cleanedString);

    // Provide default values and construct the final object
    const booking: Booking = {
      pickup: parsedData.pickup || null,
      destination: parsedData.destination || null,
      date: parsedData.date || null,
      time: parsedData.time || null,
      rideType: parsedData.rideType || "Standard",
      passengers: parsedData.passengers ? parseInt(parsedData.passengers, 10) || 1 : 1,
      specialRequests: parsedData.specialRequests || null,
    };

    return booking;
  } catch (error) {
    console.error("Error parsing booking:", error);
    return null; // Never crash if Gemini returns invalid JSON
  }
}
