// Jest global setup for Angular tests
import {setupZoneTestEnv} from "jest-preset-angular/setup-env/zone";
import '@angular/localize/init';
setupZoneTestEnv();