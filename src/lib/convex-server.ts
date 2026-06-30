import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";

type Id<T extends string> = string & { __tableName?: T };

const convexFunctions = {
    deleteAnalysis: "functions:deleteAnalysis",
    deleteCoverLetter: "functions:deleteCoverLetter",
    deleteResume: "functions:deleteResume",
    deleteTailoredResume: "functions:deleteTailoredResume",
    getAnalysis: "functions:getAnalysis",
    getAnalysisById: "functions:getAnalysisById",
    getCoverLetter: "functions:getCoverLetter",
    getCoverLetterById: "functions:getCoverLetterById",
    getResumeById: "functions:getResumeById",
    getSearchHistory: "functions:getSearchHistory",
    getTailoredResume: "functions:getTailoredResume",
    getTailoredResumeById: "functions:getTailoredResumeById",
    getTailoredResumeVersionsBySlug: "functions:getTailoredResumeVersionsBySlug",
    getUserAnalyses: "functions:getUserAnalyses",
    getUserCoverLetters: "functions:getUserCoverLetters",
    getUserResumes: "functions:getUserResumes",
    getUserStats: "functions:getUserStats",
    getUserTailoredResumes: "functions:getUserTailoredResumes",
    saveAnalysis: "functions:saveAnalysis",
    saveCoverLetter: "functions:saveCoverLetter",
    saveResume: "functions:saveResume",
    saveTailoredResume: "functions:saveTailoredResume",
} as const;

type ConvexClient = ConvexHttpClient & {
    mutation(path: string, args?: unknown): Promise<unknown>;
    query(path: string, args?: unknown): Promise<unknown>;
    setAdminAuth(token: string): void;
};

// Server-side Convex client for use in API routes.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

// Singleton client instance
let clientInstance: ConvexClient | null = null;

export function getClient() {
    if (!convexUrl) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
    }
    if (!clientInstance) {
        clientInstance = new ConvexHttpClient(convexUrl) as ConvexClient;
        const deployKey = process.env.CONVEX_DEPLOY_KEY;
        if (deployKey) {
            clientInstance.setAdminAuth(deployKey);
        }
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
    type: "analysis" | "cover-letter" | "resume";
    analysisType?: string;
    companyName?: string;
    resumeName?: string;
    jobTitle?: string;
    jobDescription?: string;
    templateId?: string;
    builderSlug?: string;
    version?: number;
    createdAt: string;
    result: string;
}

export interface TailoredResume {
    _id: string;
    _creationTime: number;
    userId: string;
    resumeHash: string;
    jobDescriptionHash: string;
    templateId: string;
    jobTitle?: string;
    companyName?: string;
    resumeName?: string;
    jobDescription?: string;
    structuredData: string;
    latexSource: string;
    builderSlug?: string;
    version?: number;
    sourceAnalysisId?: string;
    customTemplateName?: string;
    customTemplateSource?: string;
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
    const result = await client.mutation(convexFunctions.saveResume, data);
    return result as unknown as Resume;
}

export async function getUserResumes(
    userId: string,
    limit = 10
): Promise<Resume[]> {
    try {
        const client = getClient();
        const docs = await client.query(convexFunctions.getUserResumes, {
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
    resumeId: string,
    userId: string,
): Promise<Resume | null> {
    try {
        const client = getClient();
        const doc = await client.query(convexFunctions.getResumeById, {
            resumeId: resumeId as Id<"resumes">,
            userId,
        });
        return doc as unknown as Resume | null;
    } catch (error) {
        console.error("Error fetching resume:", error);
        return null;
    }
}

export async function deleteResume(resumeId: string, userId: string): Promise<boolean> {
    try {
        const client = getClient();
        return await client.mutation(convexFunctions.deleteResume, {
            resumeId: resumeId as Id<"resumes">,
            userId,
        }) as boolean;
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
    const result = await client.mutation(convexFunctions.saveAnalysis, data);
    return result as unknown as Analysis;
}

export async function getAnalysisById(
    analysisId: string,
    userId: string,
): Promise<Analysis | null> {
    try {
        const client = getClient();
        const doc = await client.query(convexFunctions.getAnalysisById, {
            analysisId: analysisId as Id<"analyses">,
            userId,
        });
        return doc as unknown as Analysis | null;
    } catch (error) {
        console.error("Error fetching analysis:", error);
        return null;
    }
}

export async function deleteAnalysis(analysisId: string, userId: string): Promise<boolean> {
    try {
        const client = getClient();
        return await client.mutation(convexFunctions.deleteAnalysis, {
            analysisId,
            userId,
        }) as boolean;
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
        const doc = await client.query(convexFunctions.getAnalysis, {
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
        const docs = await client.query(convexFunctions.getUserAnalyses, {
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
    const result = await client.mutation(convexFunctions.saveCoverLetter, data);
    return result as unknown as CoverLetter;
}

export async function getCoverLetterById(
    coverLetterId: string,
    userId: string,
): Promise<CoverLetter | null> {
    try {
        const client = getClient();
        const doc = await client.query(convexFunctions.getCoverLetterById, {
            coverLetterId: coverLetterId as Id<"coverLetters">,
            userId,
        });
        return doc as unknown as CoverLetter | null;
    } catch (error) {
        console.error("Error fetching cover letter:", error);
        return null;
    }
}

export async function deleteCoverLetter(coverLetterId: string, userId: string): Promise<boolean> {
    try {
        const client = getClient();
        return await client.mutation(convexFunctions.deleteCoverLetter, {
            coverLetterId,
            userId,
        }) as boolean;
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
        const doc = await client.query(convexFunctions.getCoverLetter, {
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
        const docs = await client.query(convexFunctions.getUserCoverLetters, {
            userId,
            limit,
        });
        return docs as unknown as CoverLetter[];
    } catch (error) {
        console.error("Error fetching user cover letters:", error);
        return [];
    }
}

// ─── Tailored Resume Functions ───────────────────────────────────────

export async function saveTailoredResume(
    data: Omit<TailoredResume, "_id" | "_creationTime">
): Promise<TailoredResume> {
    const client = getClient();
    const result = await client.mutation(convexFunctions.saveTailoredResume, data);
    return result as unknown as TailoredResume;
}

export async function getTailoredResume(
    userId: string,
    resumeHash: string,
    jobDescriptionHash: string,
    templateId: string
): Promise<TailoredResume | null> {
    try {
        const client = getClient();
        const doc = await client.query(convexFunctions.getTailoredResume, {
            userId,
            resumeHash,
            jobDescriptionHash,
            templateId,
        });
        return doc as unknown as TailoredResume | null;
    } catch (error) {
        console.error("Error fetching tailored resume:", error);
        return null;
    }
}

export async function getTailoredResumeById(
    tailoredResumeId: string,
    userId: string,
): Promise<TailoredResume | null> {
    try {
        const client = getClient();
        const doc = await client.query(convexFunctions.getTailoredResumeById, {
            tailoredResumeId: tailoredResumeId as Id<"tailoredResumes">,
            userId,
        });
        return doc as unknown as TailoredResume | null;
    } catch (error) {
        console.error("Error fetching tailored resume by id:", error);
        return null;
    }
}

export async function deleteTailoredResume(tailoredResumeId: string, userId: string): Promise<boolean> {
    try {
        const client = getClient();
        return await client.mutation(convexFunctions.deleteTailoredResume, {
            tailoredResumeId: tailoredResumeId as Id<"tailoredResumes">,
            userId,
        }) as boolean;
    } catch (error) {
        console.error("Error deleting tailored resume:", error);
        return false;
    }
}

export async function getUserTailoredResumes(
    userId: string,
    limit = 20
): Promise<TailoredResume[]> {
    try {
        const client = getClient();
        const docs = await client.query(convexFunctions.getUserTailoredResumes, {
            userId,
            limit,
        });
        return docs as unknown as TailoredResume[];
    } catch (error) {
        console.error("Error fetching user tailored resumes:", error);
        return [];
    }
}

export async function getTailoredResumeVersionsBySlug(
    userId: string,
    builderSlug: string,
    limit = 30,
): Promise<TailoredResume[]> {
    try {
        const client = getClient();
        const docs = await client.query(convexFunctions.getTailoredResumeVersionsBySlug, {
            userId,
            builderSlug,
            limit,
        });
        return docs as unknown as TailoredResume[];
    } catch (error) {
        console.error("Error fetching tailored resume versions by slug:", error);
        return [];
    }
}

// ─── Stats ───────────────────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<{
    totalScans: number;
    draftsMade: number;
    resumeCount: number;
    analysisCount: number;
    coverLetterCount: number;
    averageMatchScore: number | null;
}> {
    try {
        const client = getClient();
        const stats = await client.query(convexFunctions.getUserStats, { userId });
        return stats as {
            totalScans: number;
            draftsMade: number;
            resumeCount: number;
            analysisCount: number;
            coverLetterCount: number;
            averageMatchScore: number | null;
        };
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return {
            totalScans: 0,
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
        const history = await client.query(convexFunctions.getSearchHistory, {
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
