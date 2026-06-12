export interface ReviewAnalysis {
    review: string;
    sentiment: "Positive" | "Neutral" | "Negative";
    confidence: number;
    keywords: string[];
    summary: string;
}
