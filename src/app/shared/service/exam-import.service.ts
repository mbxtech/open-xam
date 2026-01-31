import {inject, Injectable} from '@angular/core';
import {ImportCacheService} from "./import-cache.service";
import {ExamService} from "./exam.service";
import ExamImporter from "../util/ExamImporter";
import {ReadFile} from "../model/interfaces/upload/file-upload.interfac";
import {IExam} from "../model/interfaces/exam.interface";
import {lastValueFrom} from "rxjs";
import Logger from "../util/Logger";
import {IExamImportResult} from "../model/interfaces/import/exam-import-result.interface";

@Injectable({
    providedIn: 'root',
})
export class ExamImportService {

    private readonly _cacheService = inject(ImportCacheService);
    private readonly _examService = inject(ExamService);
    private readonly _importer = new ExamImporter();
    private readonly logger = new Logger('ExamImportService');

    public async importExams(files: ReadFile[]): Promise<IExamImportResult[]> {
        const results: IExamImportResult[] = [];
        for (const file of files) {
            results.push(await this.importExam(file));
        }
        return results;
    }

    public async importExam(file: ReadFile): Promise<IExamImportResult> {
        try {
            this.logger.logInfo(`Importing exam from file: ${file.name}`);
            await lastValueFrom(this._cacheService.clearInvalidFiles());

            let importedExam: IExam | undefined;
            switch (file.type) {
                case 'application/json': {
                    importedExam = this._importer.importExamFromJSON(file.data);
                }
                    break;
                case 'text/plain': {
                    importedExam = this._importer.importFromTxt(file.data)
                }
                    break;
                default: {
                    throw new Error(`Unsupported file type: ${file.type}`);
                }
            }

            if (!importedExam) {
                this.logger.logError(`Failed to import exam from file: ${file.name}`);
                return {success: false, errorType: 'error', id: file.id};
            }

            const validationResult = await this._validateExam(importedExam, file.id);
            if (!validationResult.success) {
                return validationResult;
            }

            const createdExam = await lastValueFrom(this._examService.createExam(importedExam));
            if (!createdExam) {
                this.logger.logError(`Failed to save exam exam: ${importedExam.name}`);
                return {success: false, errorType: 'error', id: validationResult.id};
            }

            return {success: true, id: validationResult.id};

        } catch (e: unknown) {
            this.logger.logError(e);
            return {success: false, errorType: 'error', id: file.id};
        }
    }

    private async _validateExam(exam: IExam, fileId: string): Promise<IExamImportResult> {
        const validated = await lastValueFrom(this._examService.validateExam(exam))
            .catch(e => {
                this.logger.logError(e);
                return false;
            });

        if (!validated) {
            this.logger.logError(`Exam validation failed for exam: ${exam.name}`);
            const id = await lastValueFrom(this._cacheService.addInvalidFileAsJson(JSON.stringify(exam)));
            return {
                success: false,
                invalidCacheId: id.id,
                errorType: 'validation-error',
                id: fileId
            }
        }

        return {success: true, id: fileId};
    }

}
