export interface IAnswer {
  id?: number | null;
  answerText: string;
  description?: string;
  isCorrect?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  assignedOptionId?: number | null;
  questionId?: number | null;
}
