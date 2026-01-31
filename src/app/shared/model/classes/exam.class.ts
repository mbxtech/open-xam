import {IExam} from '../interfaces/exam.interface';
import {IQuestion} from '../interfaces/question.interface';
import Question from './question.class';
import {ICategory} from "../interfaces/category.interface";
import Category from "./category.class";
import {StatusType} from "../status-typ.enum";

export default class Exam implements IExam {
    public id: number | null;
    public name: string;
    public description: string;
    public pointsToSucceeded?: number | undefined | null;
    public maxQuestionsRealExam?: number | undefined | null;
    public createdAt?: Date | undefined | null;
    public updatedAt?: Date | undefined | null;
    public category?: ICategory | undefined | null;
    public questions: IQuestion[] = [];
    public statusType: StatusType = StatusType.DRAFT;
    public duration?: number | undefined;

    constructor(value: IExam) {
        this.id = value.id ?? null;
        this.name = value.name;
        this.description = value.description || '';
        this.pointsToSucceeded = value.pointsToSucceeded ?? 0;
        this.maxQuestionsRealExam = value.maxQuestionsRealExam ?? null;
        this.createdAt = value.createdAt ?? null;
        this.updatedAt = value.updatedAt ?? null;
        this.category = null;
        if (value.category?.id) {
            this.category = new Category(value.category);
        }
        if (value?.questions?.length) {
            this.questions = value.questions.map((value) => new Question(value));
        }
        this.statusType = value.statusType ?? StatusType.DRAFT;
        this.duration = value.duration ?? 0;
    }
}
