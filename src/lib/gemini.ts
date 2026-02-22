import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.warn("GOOGLE_API_KEY is not set. Gemini API calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || 'missing-api-key');

export const PROMPTS = {
  resumeOverview: `You are an experienced Technical Human Resource Manager. Your task is to evaluate the provided resume against the job description.

Please provide a professional evaluation using EXACTLY this format:

**Summary**
Write a 2-3 sentence summary of the candidate's profile and background.

**Strengths**
* First strength with explanation
* Second strength with explanation
* Third strength with explanation
(Add more bullet points as needed, each starting with *)

**Areas for Improvement**
* First area for improvement with explanation
* Second area for improvement with explanation
* Third area for improvement with explanation
(Add more bullet points as needed, each starting with *)

**Experience Overview**
Write 2-3 sentences summarizing the candidate's professional experience.

**Education**
Write 1-2 sentences about the candidate's educational background.

**Overall Assessment**
Write 2-3 sentences providing a final assessment of the candidate's fit for the role.

**Recommendation**
Write 1-2 sentences with your recommendation on next steps.

IMPORTANT: Use bullet points (*) for strengths and improvements. Keep explanations clear and actionable.`,

  keywords: `You are a skilled ATS (Applicant Tracking System) scanner with expertise in understanding technical requirements.
Analyze the resume text and job description to extract relevant skills and keywords.
Return a JSON object with exactly this structure:
{
  "technical_skills": ["skill1", "skill2", ...],
  "analytical_skills": ["skill1", "skill2", ...],
  "soft_skills": ["skill1", "skill2", ...]
}
Rules:
- Maximum 30 skills per category
- Only include skills mentioned in either the resume OR job description
- Group related concepts and prioritize the most representative skill
- Return ONLY the JSON object, no additional text`,

  matchScore: `You are an expert ATS scanner. Analyze how well the resume matches the job description.

CRITICAL: You MUST respond with ONLY a JSON object. No text before or after. No markdown. No explanation.

{
  "jobTitle": "Job Title (if mentioned, else null)",
  "companyName": "Company Name (if mentioned, else null)",
  "matchScore": 75,
  "overview": "Brief 2-3 sentence summary of fit",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "skillsMatch": {
    "matched": ["skill1", "skill2", "skill3"],
    "missing": ["skill1", "skill2", "skill3"]
  },
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

Rules:
- jobTitle: Extract the exact job title from the job description
- companyName: Extract the company name if mentioned in job description
- matchScore: integer 0-100
- overview: concise summary (max 100 words)
- strengths: 3-5 specific strengths from resume
- weaknesses: 3-5 gaps or areas to improve
- matched: skills from job description found in resume
- missing: important skills from job description NOT in resume
- recommendations: 3-5 actionable suggestions

RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`,

  coverLetter: (tone: string, wordCount: number, paragraphs: number, companyName?: string, hiringManagerName?: string, achievements?: string) => {
    let prompt = `You are an expert career coach specializing in professional writing.
Generate a compelling cover letter that:
1. Aligns the candidate's resume achievements with job requirements
2. Uses a ${tone} tone
3. Is approximately ${wordCount} words
4. Contains ${paragraphs} paragraphs
5. Written in first person
6. Only uses information from the provided resume - do not fabricate experiences`;

    if (hiringManagerName) {
      prompt += `\n7. Address the letter to ${hiringManagerName}`;
    } else {
      prompt += `\n7. Use "Dear Hiring Manager" as the greeting`;
    }

    if (companyName) {
      prompt += `\n8. Reference ${companyName} as the company name`;
    } else {
      prompt += `\n8. Use [Company Name] as a placeholder for the company name`;
    }

    if (achievements) {
      prompt += `\n9. Emphasize these specific achievements: ${achievements}`;
    }

    prompt += `\n\nFocus on demonstrating value and fit for the role. Include a proper greeting and closing.`;

    return prompt;
  },
};

export const TONE_OPTIONS = {
  professional: { label: 'Professional', wordCount: 300, paragraphs: 4 },
  friendly: { label: 'Friendly', wordCount: 250, paragraphs: 3 },
  enthusiastic: { label: 'Enthusiastic', wordCount: 350, paragraphs: 4 },
};

export const LENGTH_OPTIONS = {
  concise: { label: 'Concise', wordCount: 200, paragraphs: 3 },
  standard: { label: 'Standard', wordCount: 300, paragraphs: 4 },
  detailed: { label: 'Detailed', wordCount: 400, paragraphs: 5 },
};

export type AnalysisType = 'overview' | 'keywords' | 'match' | 'coverLetter';

interface AnalysisOptions {
  tone?: keyof typeof TONE_OPTIONS;
  length?: keyof typeof LENGTH_OPTIONS;
  companyName?: string;
  hiringManagerName?: string;
  achievements?: string;
}

export interface TailoredResumeSectionItem {
  title: string;
  subtitle?: string;
  date?: string;
  location?: string;
  bullets: string[];
}

export interface TailoredResumeData {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary: string;
  skills: string[];
  experience: TailoredResumeSectionItem[];
  projects: TailoredResumeSectionItem[];
  education: TailoredResumeSectionItem[];
  certifications: string[];
  additional: string[];
  targetTitle?: string;
  keywordsUsed: string[];
}

function createGeminiModel(analysisType: AnalysisType | 'tailoredResume') {
  const modelName = process.env.MODEL_NAME || 'gemini-2.5-flash';
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: analysisType === 'coverLetter' ? 0.8 : 0.4,
      maxOutputTokens: 16384,
    },
  });
}

function stripMarkdownJsonFence(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  const withoutStart = trimmed.replace(/^```(?:json)?\s*/i, '');
  return withoutStart.replace(/\s*```$/, '').trim();
}

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  analysisType: AnalysisType,
  options?: AnalysisOptions
): Promise<string> {
  if (!apiKey) {
    throw new Error('Google Gemini API key is not configured. Please set GOOGLE_API_KEY environment variable.');
  }

  const model = createGeminiModel(analysisType);

  let prompt: string;

  switch (analysisType) {
    case 'overview':
      prompt = PROMPTS.resumeOverview;
      break;
    case 'keywords':
      prompt = PROMPTS.keywords;
      break;
    case 'match':
      prompt = PROMPTS.matchScore;
      break;
    case 'coverLetter': {
      const tone = options?.tone || 'professional';
      const length = options?.length || 'standard';
      const toneConfig = TONE_OPTIONS[tone];
      const lengthConfig = LENGTH_OPTIONS[length];
      prompt = PROMPTS.coverLetter(
        toneConfig.label.toLowerCase(),
        lengthConfig.wordCount,
        lengthConfig.paragraphs,
        options?.companyName,
        options?.hiringManagerName,
        options?.achievements
      );
      break;
    }
    default:
      throw new Error('Invalid analysis type');
  }

  const fullPrompt = `${prompt}

Resume:
${resumeText}

Job Description:
${jobDescription}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    if (!text || text.trim() === '') {
      console.error('Gemini returned empty response');
      throw new Error('AI returned an empty response. Please try again.');
    }

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function generateTailoredResumeData(
  resumeText: string,
  jobDescription: string
): Promise<TailoredResumeData> {
  if (!apiKey) {
    throw new Error('Google Gemini API key is not configured. Please set GOOGLE_API_KEY environment variable.');
  }

  const model = createGeminiModel('tailoredResume');
  const prompt = `You are an expert ATS resume writer.
Generate tailored resume content from the SOURCE RESUME and JOB DESCRIPTION.

CRITICAL RULES:
1) Use only information from SOURCE RESUME. Do not invent employers, dates, degrees, certifications, metrics, or technologies.
2) Focus on relevance to the JOB DESCRIPTION keywords and responsibilities.
3) Keep bullets concise and impact-focused.
4) Return ONLY valid JSON, no markdown, no commentary.

Return exactly this shape:
{
  "fullName": "string or empty",
  "email": "string or empty",
  "phone": "string or empty",
  "location": "string or empty",
  "linkedin": "string or empty",
  "github": "string or empty",
  "website": "string or empty",
  "summary": "2-4 line professional summary",
  "skills": ["max 18 skills ordered by relevance"],
  "experience": [
    {
      "title": "Role title",
      "subtitle": "Company",
      "date": "Date range",
      "location": "Location",
      "bullets": ["3-5 bullets"]
    }
  ],
  "projects": [
    {
      "title": "Project name",
      "subtitle": "Tech stack or context",
      "date": "Date range or empty",
      "location": "Location or empty",
      "bullets": ["2-4 bullets"]
    }
  ],
  "education": [
    {
      "title": "Degree",
      "subtitle": "Institution",
      "date": "Date range",
      "location": "Location",
      "bullets": ["optional bullets, may be empty"]
    }
  ],
  "certifications": ["optional"],
  "additional": ["optional extras like awards/publications"],
  "targetTitle": "best-fit role title from job description",
  "keywordsUsed": ["important JD keywords reflected in the resume content"]
}

SOURCE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text || text.trim() === '') {
    throw new Error('AI returned an empty response. Please try again.');
  }

  const normalized = stripMarkdownJsonFence(text);
  try {
    return JSON.parse(normalized) as TailoredResumeData;
  } catch (error) {
    console.error('Failed to parse tailored resume JSON', { error, text: normalized });
    throw new Error('AI returned invalid structured resume data. Please try again.');
  }
}
