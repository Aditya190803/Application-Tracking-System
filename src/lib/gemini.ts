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

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  analysisType: AnalysisType,
  options?: AnalysisOptions
): Promise<string> {
  if (!apiKey) {
    throw new Error('Google Gemini API key is not configured. Please set GOOGLE_API_KEY environment variable.');
  }

  // Using gemini-2.5-flash (thinking model) - requires higher token limits
  // as thinking tokens count against maxOutputTokens
  const modelName = process.env.MODEL_NAME || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: analysisType === 'coverLetter' ? 0.8 : 0.4,
      maxOutputTokens: 16384, // Higher limit to accommodate thinking + response
    },
  });

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
