import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Server-side Convex client for use in API routes
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

// Singleton client instance
let clientInstance: ConvexHttpClient | null = null;

export function getClient() {
    if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }
    if (!clientInstance) {
        clientInstance = new ConvexHttpClient(convexUrl);
    }
    return clientInstance;
}

// Types
export interface Analysis {
    _id: string;
    _creationTime: number;
    userId: string;
    resumeHash: string;
    jobDescriptionHash: string;
    analysisType: string;
    result: string;
    resumeName?: string;
    jobTitle?: string;
    companyName?: string;
    jobDescription?: string;
}

export interface CoverLetter {
    _id: string;
    _creationTime: number;
    userId: string;
    resumeHash: string;
    jobDescriptionHash: string;
    companyName?: string;
    hiringManagerName?: string;
    tone: string;
    length: string;
    result: string;
    resumeName?: string;
    jobDescription?: string;
}

export interface Resume {
    _id: string;
    _creationTime: number;
    userId: string;
    name: string;
    textContent: string;
    fileSize?: number;
    pageCount?: number;
}

export interface SearchHistoryItem {
    id: string;
    type: "analysis" | "cover-letter";
    analysisType?: string;
    companyName?: string;
    resumeName?: string;
    jobTitle?: string;
    jobDescription?: string;
    createdAt: string;
    result: string;
}

// Helper: Generate hash for caching
export function generateHash(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
}

// ─── Resume Functions ────────────────────────────────────────────────

export async function saveResume(
    data: Omit<Resume, "_id" | "_creationTime">
): Promise<Resume> {
    const client = getClient();
    const result = await client.mutation(api.functions.saveResume, data);
    return result as unknown as Resume;
}

export async function getUserResumes(
    userId: string,
    limit = 10
): Promise<Resume[]> {
    try {
        const client = getClient();
        const docs = await client.query(api.functions.getUserResumes, {
            userId,
            limit,
        });
        return docs as unknown as Resume[];
    } catch (error) {
        console.error("Error fetching user resumes:", error);
        return [];
    }
}

export async function getResumeById(
    resumeId: string
): Promise<Resume | null> {
    try {
        const client = getClient();
        const doc = await client.query(api.functions.getResumeById, {
            resumeId: resumeId as Id<"resumes">,
        });
        return doc as unknown as Resume | null;
    } catch (error) {
        console.error("Error fetching resume:", error);
        return null;
    }
}

export async function deleteResume(resumeId: string): Promise<boolean> {
    try {
        const client = getClient();
        await client.mutation(api.functions.deleteResume, {
            resumeId: resumeId as Id<"resumes">,
        });
        return true;
    } catch (error) {
        console.error("Error deleting resume:", error);
        return false;
    }
}

// ─── Analysis Functions ──────────────────────────────────────────────

export async function saveAnalysis(
    data: Omit<Analysis, "_id" | "_creationTime">
): Promise<Analysis> {
    const client = getClient();
    const result = await client.mutation(api.functions.saveAnalysis, data);
    return result as unknown as Analysis;
}

export async function getAnalysisById(
    analysisId: string
): Promise<Analysis | null> {
    try {
        const client = getClient();
        const doc = await client.query(api.functions.getAnalysisById, {
            analysisId: analysisId as Id<"analyses">,
        });
        return doc as unknown as Analysis | null;
    } catch (error) {
        console.error("Error fetching analysis:", error);
        return null;
    }
}

export async function deleteAnalysis(analysisId: string): Promise<boolean> {
    try {
        const client = getClient();
        await (client as unknown as { mutation: (path: string, args: unknown) => Promise<unknown> }).mutation(
            "functions:deleteAnalysis",
            { analysisId }
        );
        return true;
    } catch (error) {
        console.error("Error deleting analysis:", error);
        return false;
    }
}

export async function getAnalysis(
    userId: string,
    resumeHash: string,
    jobDescriptionHash: string,
    analysisType: string
): Promise<Analysis | null> {
    try {
        const client = getClient();
        const doc = await client.query(api.functions.getAnalysis, {
            userId,
            resumeHash,
            jobDescriptionHash,
            analysisType,
        });
        return doc as unknown as Analysis | null;
    } catch (error) {
        console.error("Error fetching analysis:", error);
        return null;
    }
}

export async function getUserAnalyses(
    userId: string,
    limit = 20
): Promise<Analysis[]> {
    try {
        const client = getClient();
        const docs = await client.query(api.functions.getUserAnalyses, {
            userId,
            limit,
        });
        return docs as unknown as Analysis[];
    } catch (error) {
        console.error("Error fetching user analyses:", error);
        return [];
    }
}

// ─── Cover Letter Functions ──────────────────────────────────────────

export async function saveCoverLetter(
    data: Omit<CoverLetter, "_id" | "_creationTime">
): Promise<CoverLetter> {
    const client = getClient();
    const result = await client.mutation(api.functions.saveCoverLetter, data);
    return result as unknown as CoverLetter;
}

export async function getCoverLetterById(
    coverLetterId: string
): Promise<CoverLetter | null> {
    try {
        const client = getClient();
        const doc = await client.query(api.functions.getCoverLetterById, {
            coverLetterId: coverLetterId as Id<"coverLetters">,
        });
        return doc as unknown as CoverLetter | null;
    } catch (error) {
        console.error("Error fetching cover letter:", error);
        return null;
    }
}

export async function deleteCoverLetter(coverLetterId: string): Promise<boolean> {
    try {
        const client = getClient();
        await (client as unknown as { mutation: (path: string, args: unknown) => Promise<unknown> }).mutation(
            "functions:deleteCoverLetter",
            { coverLetterId }
        );
        return true;
    } catch (error) {
        console.error("Error deleting cover letter:", error);
        return false;
    }
}

export async function getCoverLetter(
    userId: string,
    resumeHash: string,
    jobDescriptionHash: string,
    tone: string,
    length: string
): Promise<CoverLetter | null> {
    try {
        const client = getClient();
        const doc = await client.query(api.functions.getCoverLetter, {
            userId,
            resumeHash,
            jobDescriptionHash,
            tone,
            length,
        });
        return doc as unknown as CoverLetter | null;
    } catch (error) {
        console.error("Error fetching cover letter:", error);
        return null;
    }
}

export async function getUserCoverLetters(
    userId: string,
    limit = 20
): Promise<CoverLetter[]> {
    try {
        const client = getClient();
        const docs = await client.query(api.functions.getUserCoverLetters, {
            userId,
            limit,
        });
        return docs as unknown as CoverLetter[];
    } catch (error) {
        console.error("Error fetching user cover letters:", error);
        return [];
    }
}

// ─── Stats ───────────────────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<{
    totalScans: number;
    avgScore: number;
    draftsMade: number;
    resumeCount: number;
    analysisCount: number;
    coverLetterCount: number;
    averageMatchScore: number | null;
}> {
    try {
        const client = getClient();
        const stats = await client.query(api.functions.getUserStats, { userId });
        return stats;
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return {
            totalScans: 0,
            avgScore: 0,
            draftsMade: 0,
            resumeCount: 0,
            analysisCount: 0,
            coverLetterCount: 0,
            averageMatchScore: null,
        };
    }
}

// ─── Search History ──────────────────────────────────────────────────

export async function getSearchHistory(
    userId: string,
    limit = 50,
    cursor?: string,
): Promise<{ items: SearchHistoryItem[]; nextCursor: string | null }> {
    try {
        const client = getClient();
        const history = await client.query(api.functions.getSearchHistory, {
            userId,
            limit,
            cursor,
        });
        return history as unknown as { items: SearchHistoryItem[]; nextCursor: string | null };
    } catch (error) {
        console.error("Error fetching search history:", error);
        return { items: [], nextCursor: null };
    }
}
