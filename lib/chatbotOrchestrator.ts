"use server";

import { processChatWithNLP } from "./nlpEngine";
import { ChatContext, ChatMessage, NLPEntities } from "../types/chat";
import { calculateFare, CalculateFareParams } from "./fareCalculator";
import { getTopDrivers } from "./driverMatcher";
import { WorkflowState } from "./workflowManager";
import { generateMockBookingId, saveReviewIntegration } from "./integrationService";
import { analyzeReview } from "./sentimentAnalyzer";
import { generateRecommendations } from "./recommendationEngine";

export async function handleUserMessage(
  message: string,
  context: ChatContext
): Promise<{ newMessage: ChatMessage; updatedEntities: NLPEntities; updatedWorkflow: WorkflowState }> {
  try {
    let currentWorkflow: WorkflowState = context.workflowState || { currentStep: "INIT" };
    
    // 1. Send to NLP Engine
    const nlpResult = await processChatWithNLP(message, context);

    let finalResponseText = nlpResult.response;
    let enrichedData: any = {};
    let newWorkflowState = { ...currentWorkflow };

    // 2. Handle specific intents
    
    // A. BOOK RIDE
    if (
      nlpResult.intent === "BookRide" &&
      nlpResult.missingFields.length === 0 &&
      nlpResult.entities.pickup &&
      nlpResult.entities.destination
    ) {
      newWorkflowState.currentStep = "PARSED";

      try {
        const fareParams: CalculateFareParams = {
          pickup: nlpResult.entities.pickup,
          destination: nlpResult.entities.destination,
          rideType: nlpResult.entities.rideType || "Standard",
          trafficLevel: "Normal"
        };
        const fareResult = await calculateFare(fareParams);
        enrichedData.fareEstimate = fareResult;
        newWorkflowState.fare = fareResult.estimate;
        newWorkflowState.currentStep = "ESTIMATED";
        
        finalResponseText = `Great! I have all the details for your ride from ${nlpResult.entities.pickup} to ${nlpResult.entities.destination}. Let me estimate your fare and find the best drivers for you.`;
      } catch (err) {}

      try {
        const bookingDetails = {
          pickup: nlpResult.entities.pickup,
          destination: nlpResult.entities.destination,
          rideType: nlpResult.entities.rideType,
          priority: nlpResult.entities.priority
        };
        const drivers = await getTopDrivers(bookingDetails);
        enrichedData.driverRecommendations = drivers;
        
        if (drivers.length > 0) {
          newWorkflowState.driver = drivers[0].driver; // Select the top driver for the mock workflow
          newWorkflowState.currentStep = "MATCHED";
          finalResponseText += ` I recommend ${drivers[0].driver.name} based on your preferences. Would you like to confirm this booking?`;
        }
      } catch (err) {}
    }
    
    // B. CONFIRM BOOKING
    if (nlpResult.intent === "ConfirmBooking" && currentWorkflow.currentStep === "MATCHED") {
      const bookingId = await generateMockBookingId();
      newWorkflowState.bookingId = bookingId;
      newWorkflowState.currentStep = "CONFIRMED";
      finalResponseText = `Your booking is confirmed! Your booking ID is ${bookingId}.`;
      enrichedData.bookingConfirmed = true; // Signals UI to show Booking Summary
    }

    // C. SUBMIT REVIEW
    if (nlpResult.intent === "SubmitReview" && currentWorkflow.currentStep === "COMPLETED" && nlpResult.entities.reviewText) {
      try {
        const sentimentResult = await analyzeReview(nlpResult.entities.reviewText);
        await saveReviewIntegration(sentimentResult.sentiment as any);
        
        // Fetch recommendations based on the completed ride
        const recs = await generateRecommendations();

        newWorkflowState.reviewSentiment = sentimentResult;
        newWorkflowState.currentStep = "REVIEWED";
        
        finalResponseText = `Thank you for your feedback! We detected a ${sentimentResult.sentiment} sentiment.`;
        enrichedData.reviewAnalyzed = sentimentResult;
        
        if (recs && recs.length > 0) {
          enrichedData.recommendations = recs;
        }

      } catch (err) {
        console.error("Sentiment analysis failed", err);
      }
    }

    // 3. Construct the bot's reply
    const botMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "bot",
      content: finalResponseText,
      timestamp: Date.now(),
      enrichedData: Object.keys(enrichedData).length > 0 ? enrichedData : undefined
    };

    return {
      newMessage: botMessage,
      updatedEntities: nlpResult.entities,
      updatedWorkflow: newWorkflowState
    };
  } catch (error: any) {
    return {
      newMessage: {
        id: Date.now().toString(),
        role: "bot",
        content: error.message || "I encountered an error processing your request.",
        timestamp: Date.now()
      },
      updatedEntities: context.currentEntities,
      updatedWorkflow: context.workflowState || { currentStep: "INIT" }
    };
  }
}
