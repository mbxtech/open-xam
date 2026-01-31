import {Routes} from '@angular/router';
import {AdminPageLayout} from './features/admin/admin-page-layout/admin-page-layout';
import {ExamComponent} from './features/admin/exam/pages/exam/exam.component';
import {OverviewComponent} from './features/admin/exam/pages/overview/overview.component';
import {EditComponent} from './features/admin/exam/pages/edit/edit.component';
import {ImportsComponent} from './features/admin/exam/pages/imports/imports.component';
import {LearningRouteWrapper} from './features/learning/exam/pages/learning-route-wrapper/learning-route-wrapper';
import {ExamLearningOverview} from './features/learning/exam/pages/exam-learning-overview/exam-learning-overview';
import {Simulation} from './features/learning/exam/pages/simulation/simulation';
import {CertificationMode} from './features/learning/exam/pages/certification-mode/certification-mode';
import {Dashboard} from './features/dashboard/dashboard';
import {CategoriesAdmin} from "./features/admin/categories/categories-admin/categories-admin";

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        component: Dashboard,
        data: {breadcrumb: $localize`:@@ox.general.breadcrumb.dashboard:Dashboard`},
    },
    {
        path: 'admin',
        component: AdminPageLayout,
        data: {breadcrumb: $localize`:@@ox.general.breadcrumb.admin:Admin`},
        children: [
            {
                path: 'exam',
                component: ExamComponent,
                data: {breadcrumb: $localize`:@@ox.general.breadcrumb.exam:Exam`},
                children: [
                    {
                        path: 'overview',
                        component: OverviewComponent,
                        data: {breadcrumb: $localize`:@@ox.general.breadcrumb.overview:Overview`},
                    },
                    {
                        path: 'imports',
                        component: ImportsComponent,
                        data: {breadcrumb: $localize`:@@ox.general.breadcrumb.imports:Failed Imports`},
                    },
                    {
                        path: 'edit',
                        component: EditComponent,
                        data: {breadcrumb: $localize`:@@ox.general.breadcrumb.create:Create`},
                    },
                    {
                        path: 'edit/:id',
                        component: EditComponent,
                        data: {breadcrumb: $localize`:@@ox.general.breadcrumb.edit:Edit`},
                    },
                    {
                        path: 'edit/:importId',
                        component: EditComponent,
                        data: {breadcrumb: $localize`:@@ox.general.breadcrumb.edit:Edit`},
                    },
                    {
                        path: '',
                        redirectTo: 'overview',
                        pathMatch: 'full'
                    }
                ]
            },
            {
                path: 'categories',
                component: CategoriesAdmin,
                data: {breadcrumb: $localize`:@@ox.general.breadcrumb.categories:Categories`},
            },
            {
                path: '',
                redirectTo: 'exam/overview',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'exam',
        redirectTo: 'admin/exam',
        pathMatch: 'prefix'
    },
    {
        path: 'learning',
        component: LearningRouteWrapper,
        data: {
            breadcrumb: $localize`:@@ox.general.breadcrumb.learning:Learning`
        },
        children: [
            {
                path: 'simulation/:id',
                component: Simulation,
                data: {
                    breadcrumb: $localize`:@@ox.general.breadcrumb.exam.simulation:Simulation`
                }
            },
            {
                path: 'certification/:id',
                component: CertificationMode,
                data: {
                    breadcrumb: $localize`:@@ox.general.breadcrumb.exam.certification:Certification`
                }
            },
            {
                path: '**',
                component: ExamLearningOverview,
                data: {
                    breadcrumb: $localize`:@@ox.general.breadcrumb.exam.overview:Exam overview`
                }
            }
        ]
    },
    {
        path: 'categories',
        redirectTo: 'admin/categories',
        pathMatch: 'full'
    }
];
