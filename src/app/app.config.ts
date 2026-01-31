import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from "@angular/core";
import {provideRouter} from "@angular/router";

import {routes} from "./app.routes";
import {provideAnimations} from "@angular/platform-browser/animations";
import {provideIndexedDb} from "ngx-indexed-db";

const importIndexDBConfig = {
    name: 'importCache',
    version: 1,
    objectStoresMeta: [{
        store: 'cache',
        storeConfig: {keyPath: 'id', autoIncrement: true},
        storeSchema: [{name: 'data', keypath: 'data', options: {unique: true}}]
    }]
};

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({eventCoalescing: true}),
        provideRouter(routes),
        provideAnimations(),
        provideIndexedDb(importIndexDBConfig)
    ],
};
