import {inject, Injectable} from '@angular/core';
import {NgxIndexedDBService, WithID} from "ngx-indexed-db";
import {Observable} from "rxjs";


@Injectable({
  providedIn: 'root',
})
export class ImportCacheService {
  private readonly _db = inject(NgxIndexedDBService);
  private readonly _storeName = 'cache';

  public addInvalidFileAsJson(json: string): Observable<{data: string} & WithID> {
    return this._db.add(this._storeName, {data: json});
  }
  public getAllInvalidFiles(): Observable<WithID[]> {
    return this._db.getAll(this._storeName);
  }
  public loadInvalidFile(id: number): Observable<{data: string}> {
    return this._db.getByID(this._storeName, id);
  }
  public clearInvalidFiles(): Observable<void> {
    return this._db.clear(this._storeName);
  }

  public deleteInvalidFile(id: number): Observable<unknown[]> {
    return this._db.delete(this._storeName, id);
  }
}
