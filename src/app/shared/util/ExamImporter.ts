import Logger from "./Logger";
import {IAnswer} from "../model/interfaces/answer.interface";
import {IExam} from "../model/interfaces/exam.interface";
import {StatusType} from "../model/status-typ.enum";
import {QuestionType} from "../model/question-type.enum";
import {IQuestion} from "../model/interfaces/question.interface";

export enum ExamImportTextPrefix {
    QUESTION_IDENTIFIER = 'Q:',
    ASSIGNMENT_IDENTIFIER = 'A:',
    POINTS_IDENTIFIER = 'P:',
}

export default class ExamImporter {

    private readonly _logger = new Logger('ExamImporter');
    public importExamFromJSON(json: string | ArrayBuffer): IExam {
        this._logger.logInfo(`Start import of exam from json file`);

        const exam: IExam = JSON.parse(this._bufferToString(json));
        this._logger.logInfo(`Import exam with name: ${exam.name}, count questions: ${exam.questions.length}`);
        return exam;

    }
    public importFromTxt(text: string | ArrayBuffer): IExam {
        this._logger.logInfo(`Start import of exam from text file`);
        const convertedText = this._bufferToString(text);
        const lines = convertedText
            .split("\n")
            .map(this._clean)
            .filter(Boolean);
        let examPointsToSucceeded = 0;
        let questions: IQuestion[] = [];
        let i = 0;

        while (i < lines.length) {
            // skipp empty lines and lines that have nothing to do with questions
            if (!this._isQuestionHeader(lines[i])) {
                i++;
                continue;
            }

            const header = lines[i];
            const pointsTotal = this._extractPoints(header);
            i++;
            examPointsToSucceeded += pointsTotal;

            const questionTextLines = [];

            // read in question text until the assignment header or answer header is found
            while (
                i < lines.length &&
                !this._isAnswerHeader(lines[i]) &&
                !this._isAssignmentHeader(lines[i])
                ) {
                questionTextLines.push(lines[i]);
                i++;
            }

            const questionText = questionTextLines.join(" ");

            //if we have assignment type skip to next question
            const assignments = this._handleAssignments(lines, questionText, pointsTotal, i);
            if (assignments.length) {
                questions = questions.concat(assignments);
                continue;
            }


            const {answers, pointsPerCorrectAnswer, type} = this._handleSingleOrMultipleChoice(lines, pointsTotal, i);

            questions.push({
                id: null,
                questionText,
                pointsTotal,
                type,
                answers,
                pointsPerCorrectAnswer,
                createdAt: null,
                updatedAt: null,
                options: [],
                examId: null
            });
        }

        this._logger.logInfo(`Exam imported with ${questions.length} questions`);
        return {
            id: null,
            name: 'Imported Certificate',
            description: "Automatically parsed from text file",
            pointsToSucceeded: Math.round((examPointsToSucceeded / 100) * 70),
            duration: 30,
            statusType: StatusType.DRAFT,
            maxQuestionsRealExam: 30,
            createdAt: null,
            updatedAt: null,
            questions
        };
    }

    private _handleAssignments(lines: string[], questionText: string, pointsTotal: number, i: number): IQuestion[] {
        const questions = [];

        if (i < lines.length && this._isAssignmentHeader(lines[i])) {
            const optionLine = lines[i].replace(/^A:\s*/, "");
            const optionTexts = optionLine.split("|").map(o => o.trim());

            const options = optionTexts.map((text, idx) => ({
                rowId: null,
                id: idx + 1,
                text,
                questionId: null
            }));

            i++;

            const answers = [];

            while (i < lines.length && lines[i].includes("[")) {
                const marks = [...lines[i].matchAll(/\[([xX ])]/g)]
                    .map(m => m[1].toLowerCase());

                const answerText = lines[i]
                    .replace(/\[[xX ]]/g, "")
                    .replace(/\([a-z]\)/, "")
                    .trim();

                const assignedIndex = marks.findIndex(m => m === "x");

                answers.push({
                    id: null,
                    answerText,
                    description: answerText,
                    isCorrect: null,
                    assignedOptionId:
                        assignedIndex >= 0 ? assignedIndex + 1 : null,
                    createdAt: null,
                    updatedAt: null,
                    questionId: null
                });

                i++;
            }

            questions.push({
                id: null,
                questionText,
                pointsTotal,
                type: QuestionType.ASSIGNMENT,
                answers,
                pointsPerCorrectAnswer: 1,
                createdAt: null,
                updatedAt: null,
                options,
                examId: null
            });

        }

        return questions

    }

    private _handleSingleOrMultipleChoice(lines: string[], pointsTotal: number, i: number):{answers: IAnswer[], pointsPerCorrectAnswer: number, type: QuestionType} {
        const answers = [];

        while (i < lines.length && this._isAnswerHeader(lines[i])) {
            answers.push(this._extractAnswer(lines[i]));
            i++;
        }

        const correctCount = answers.filter(a => a.isCorrect).length;

        const type =
            correctCount > 1 ? QuestionType.MULTIPLE_CHOICE : QuestionType.SINGLE_CHOICE;

        const pointsPerCorrectAnswer =
            type === QuestionType.MULTIPLE_CHOICE && correctCount > 0
                ? Math.round(pointsTotal / correctCount)
                : 0;

        return {answers, pointsPerCorrectAnswer, type};
    }

    private _clean(str: string): string {
        return str.replace(/\r/g, "").trim();
    }

    private _isQuestionHeader(line: string): boolean {
        return line.startsWith(ExamImportTextPrefix.QUESTION_IDENTIFIER);
    }

    private _extractPoints(line: string): number {
        const regex = new RegExp(`${ExamImportTextPrefix.POINTS_IDENTIFIER}\\s*([0-9]*)`);
        const m = line.match(regex);
        return m ? Number(m[1]) : 0;
    }

    private _isAnswerHeader(line: string): boolean {
        return /^\[[xX ]]\s(?:[()]|[a-zA-Z])/.test(line);
    }

    private _isAssignmentHeader(line: string): boolean {
        const regex = new RegExp(`^${ExamImportTextPrefix.ASSIGNMENT_IDENTIFIER}\\s*`);
        return regex.test(line);
    }

    private _extractAnswer(line: string): IAnswer {
        const isCorrect = /^\[[xX]]/.test(line);
        const text = line
            .replace(/^\[[xX ]]\s*\([a-z]\)\s*/, "")
            .trim();

        return {
            id: null,
            answerText: text,
            description: text,
            isCorrect,
            createdAt: null,
            updatedAt: null,
            questionId: null
        };
    }

    private _bufferToString(str: string | ArrayBuffer): string {
        let value: string;
        if (str instanceof ArrayBuffer) {
            this._logger.logInfo(`Converting ArrayBuffer to string with encoding: utf-8`);
            const decoder = new TextDecoder('utf-8');
            value = decoder.decode(str);
        } else {
            value = str;
        }

        return value;
    }

}