import {IAssignmentOption} from "../interfaces/assignment-option.interface";

export default class AssignmentOption implements IAssignmentOption {
    id: number;
    text: string;
    questionId?: number | null;
    rowId?: number | null;

    constructor(option: IAssignmentOption) {
        this.id = option.id;
        this.text = option.text;
        this.questionId = option.questionId ?? null;
        this.rowId = option.rowId;
    }
}