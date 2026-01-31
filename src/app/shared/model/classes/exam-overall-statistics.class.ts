import { IExamOverallStatistics } from "../interfaces/exam-overall-statistics.interface";

export default class ExamOverallStatistics implements IExamOverallStatistics {
    averageQuestionCount: number;
    examCount: number;
    averageSucceedingScore: number;
    archiveCount: number;
    activeCount: number;
    draftCount: number;
    inactiveCount: number;

    constructor(statistics: IExamOverallStatistics) {
        this.averageQuestionCount = statistics.averageQuestionCount;
        this.examCount = statistics.examCount;
        this.averageSucceedingScore = statistics.averageSucceedingScore;
        this.archiveCount = statistics.archiveCount;
        this.activeCount = statistics.activeCount;
        this.draftCount = statistics.draftCount;
        this.inactiveCount = statistics.inactiveCount;
    }

}