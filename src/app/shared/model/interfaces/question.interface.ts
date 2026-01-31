import {IAnswer} from './answer.interface';
import {ICategory} from "./category.interface";
import {IAssignmentOption} from "./assignment-option.interface";
import {QuestionType} from "../question-type.enum";
export interface IQuestion {
    id?: number | null;
    questionText: string;
    pointsTotal: number;
    type: QuestionType;
    answers: IAnswer[];
    pointsPerCorrectAnswer?: number | null;
    category?: ICategory | null | undefined;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    options?: IAssignmentOption[];
    examId?: number | null;
}