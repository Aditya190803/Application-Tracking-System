export interface InterviewQuestion {
  id: string;
  category: "behavioral" | "technical" | "role";
  question: string;
  guidance: string;
  answer: string;
}

export interface InterviewPreparation {
  revision: string;
  inputHash: string;
  generatedAt: number;
  questions: InterviewQuestion[];
}
