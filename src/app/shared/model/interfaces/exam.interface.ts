import {IQuestion} from './question.interface';
import {ICategory} from "./category.interface";
import {StatusType} from "../status-typ.enum";

export interface IExam {
  id: number | null;
  name: string;
  description: string;
  duration?: number;
  pointsToSucceeded?: number | null;
  maxQuestionsRealExam?: number | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  category?: ICategory | null;
  questions: IQuestion[];
  statusType: StatusType | null;
}