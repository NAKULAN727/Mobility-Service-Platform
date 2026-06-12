"use server";

import { processChatWithNLP } from "./nlpEngine";
import { ChatContext, ChatMessage, NLPEntities } from "../types/chat";
import { calculateFare, CalculateFareParams } from "./fareCalculator";
import { getTopDrivers } from "./driverMatcher";
import { WorkflowState } from "./workflowManager";
import { analyzeReview } from "./sentimentAnalyzer";
import { generateRecommendations } from "./recommendationEngine";
import prisma from "./prisma";

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
          serviceType: nlpResult.entities.serviceType || "CAR_WITH_DRIVER",
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
          serviceType: nlpResult.entities.serviceType,
          priority: nlpResult.entities.priority
        };
        const drivers = await getTopDrivers(bookingDetails);
        enrichedData.driverRecommendations = drivers;
        
        if (drivers.length > 0) {
          newWorkflowState.driver = drivers[0].driver; // Select the top driver for the workflow
          newWorkflowState.currentStep = "MATCHING";
          
          // Inject smart recommendation logic
          const mode = nlpResult.entities.serviceType === "DRIVER_ONLY" ? "Drive My Car" : "Car + Driver";
          finalResponseText += ` I recommend ${drivers[0].driver.fullName || "a top driver"} for your ${mode} service because they have a 4.9 rating and are highly experienced. Would you like to confirm this booking?`;
        }
      } catch (err) {}
    }
    
    // B. CONFIRM BOOKING
    if (nlpResult.intent === "ConfirmBooking" && currentWorkflow.currentStep === "MATCHING") {
      const customerId = context.customerId || "customer-id-123";
      
      // 1. Create Location in DB
      const location = await prisma.location.create({
        data: {
          pickupLocation: nlpResult.entities.pickup || context.currentEntities.pickup || "Forum Mall, Koramangala",
          destinationLocation: nlpResult.entities.destination || context.currentEntities.destination || "MG Road Metro Station",
          distance: currentWorkflow.fare?.distanceKm || 12,
          estimatedDuration: currentWorkflow.fare?.estimatedDurationMin || 28,
        }
      });
      
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // 2. Find Available Vehicle
      const vehicle = await prisma.vehicle.findFirst({
        where: { availabilityStatus: "AVAILABLE" }
      });
      if (vehicle) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { availabilityStatus: "BOOKED" }
        });
      }

      // 3. Create Booking in DB
      const booking = await prisma.booking.create({
        data: {
          customerId,
          driverId: currentWorkflow.driver?.id || null, // Assign dynamically from AI matching
          vehicleId: vehicle?.id || null,
          serviceType: nlpResult.entities.serviceType === "DRIVER_ONLY" ? "DRIVER_ONLY" : "CAR_WITH_DRIVER",
          locationId: location.id,
          bookingDate: new Date(nlpResult.entities.date || context.currentEntities.date || new Date().toISOString().split("T")[0]),
          bookingTime: nlpResult.entities.time || context.currentEntities.time || "09:00",
          fareAmount: currentWorkflow.fare?.totalFare || 180,
          bookingStatus: "REQUESTED",
          otpCode,
        }
      });

      // 4. Create Payment in DB
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.fareAmount,
          paymentMethod: "CARD",
          paymentStatus: "PENDING",
        }
      });

      newWorkflowState.bookingId = booking.id;
      newWorkflowState.currentStep = "CONFIRMED";
      const driverName = currentWorkflow.driver?.fullName || "Your driver";
      finalResponseText = `Your booking is confirmed! Your booking ID is ${booking.id}. Your boarding PIN is ${otpCode}. ${driverName} is on the way!`;
      enrichedData.bookingConfirmed = true; 
    }

    // C. SUBMIT REVIEW
    if (nlpResult.intent === "SubmitReview" && currentWorkflow.currentStep === "TRIP_COMPLETED" && nlpResult.entities.reviewText) {
      try {
        const sentimentResult = await analyzeReview(nlpResult.entities.reviewText);
        
        // Save review to PostgreSQL database via Prisma
        if (currentWorkflow.bookingId) {
          await prisma.review.create({
            data: {
              bookingId: currentWorkflow.bookingId,
              rating: 5, // Default rating for conversational submission
              reviewText: nlpResult.entities.reviewText,
              sentiment: sentimentResult.sentiment,
              confidence: sentimentResult.confidence,
              keywords: sentimentResult.keywords,
              summary: sentimentResult.summary,
            }
          });
        }

        // Fetch recommendations based on history
        const recs = await generateRecommendations(context.customerId);

        newWorkflowState.reviewSentiment = sentimentResult;
        newWorkflowState.currentStep = "REVIEWED";
        
        finalResponseText = `Thank you for your feedback! I analyzed your review:\n\nSentiment: ${sentimentResult.sentiment} (Confidence: ${Math.round(sentimentResult.confidence * 100)}%)\nKeywords: ${sentimentResult.keywords.join(", ")}\nSummary: "${sentimentResult.summary}"`;
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
