import {IAnswer} from '../interfaces/answer.interface';

export default class Answer implements IAnswer {

    id?: number | undefined | null;
    answerText: string;
    description: string | undefined;
    isCorrect: boolean | undefined | null;
    createdAt: Date | undefined | null;
    updatedAt: Date | undefined | null;
    assignedOptionId?: number | null;
    questionId?: number | null;

    constructor(answer: IAnswer) {
        this.id = answer.id ?? null;
        this.answerText = answer.answerText;
        this.description = answer.description;
        this.isCorrect = answer.isCorrect ?? null;
        this.createdAt = answer.createdAt ?? null;
        this.updatedAt = answer.updatedAt ?? null;
        this.assignedOptionId = answer.assignedOptionId ?? null;
        this.questionId = answer.questionId ?? null;
    }
}