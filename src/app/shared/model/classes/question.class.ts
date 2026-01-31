import {IAnswer} from '../interfaces/answer.interface';
import AssignmentOption from "./assiginment-options.class";
import Category from "./category.class";
import {ICategory} from "../interfaces/category.interface";
import {IQuestion} from "../interfaces/question.interface";
import {QuestionType} from "../question-type.enum";
import {IAssignmentOption} from "../interfaces/assignment-option.interface";
import Answer from "./answer.class";

export default class Question implements IQuestion {
  id?: number | undefined | null;
  questionText: string;
  pointsTotal: number;
  type: QuestionType;
  answers: IAnswer[];
  pointsPerCorrectAnswer?: number | undefined | null;
  category?: ICategory | undefined | null;
  createdAt?: Date | undefined | null;
  updatedAt?: Date | undefined | null;
  options?: IAssignmentOption[] | undefined;
  examId?: number;

  constructor(question: IQuestion) {
    this.id = question.id ?? null;
    this.questionText = question.questionText;
    this.pointsTotal = question.pointsTotal;
    this.type = question.type;
    this.options = question.options?.map((opt) => new AssignmentOption(opt)) || [];
    this.answers = question.answers.map((answer) => new Answer(answer));
    this.pointsPerCorrectAnswer = question.pointsPerCorrectAnswer ?? null;
    this.category = null;
    if (question.category?.id) {
      this.category = new Category(question.category);
    }
    this.createdAt = question.createdAt ?? null;
    this.updatedAt = question.updatedAt ?? null;
    this.examId = question.examId ?? 0;
  }
}