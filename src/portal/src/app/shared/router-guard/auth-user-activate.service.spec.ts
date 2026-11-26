// Copyright Project Harbor Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SessionService } from '../services/session.service';
import { AppConfigService } from '../../services/app-config.service';
import { MessageHandlerService } from '../services/message-handler.service';
import { SearchTriggerService } from '../components/global-search/search-trigger.service';
import { AuthCheckGuard } from './auth-user-activate.service';

describe('AuthCheckGuard', () => {
    // A visitor who hasn't signed in
    const fakeSessionService = {
        getCurrentUser: () => null,
        retrieveUser: () =>
            throwError(() => new HttpErrorResponse({ status: 401 })),
        isGuest: () => false,
    };
    const fakeAppConfigService = {
        getConfig: () => ({}),
    };
    const fakeMessageHandlerService = {
        clear: () => {},
    };
    const fakeSearchTriggerService = {
        closeSearch: (close: boolean) => {},
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                AuthCheckGuard,
                { provide: SessionService, useValue: fakeSessionService },
                { provide: AppConfigService, useValue: fakeAppConfigService },
                {
                    provide: MessageHandlerService,
                    useValue: fakeMessageHandlerService,
                },
                {
                    provide: SearchTriggerService,
                    useValue: fakeSearchTriggerService,
                },
            ],
        });
    });

    function activate(
        guard: AuthCheckGuard,
        url: string = '/harbor/projects'
    ): boolean {
        const route = { queryParams: {} } as ActivatedRouteSnapshot;
        const state = { url } as RouterStateSnapshot;
        let result: boolean;
        (guard.canActivate(route, state) as Observable<boolean>).subscribe(
            r => (result = r)
        );
        return result;
    }

    it('should be created', inject(
        [AuthCheckGuard],
        (service: AuthCheckGuard) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should send a visitor who is not signed in to sign-in', inject(
        [AuthCheckGuard, Router],
        (guard: AuthCheckGuard, router: Router) => {
            const navigate = spyOn(router, 'navigate').and.resolveTo(true);
            expect(activate(guard)).toBeFalse();
            expect(navigate).toHaveBeenCalledWith(['/account/sign-in'], {
                queryParams: { redirect_url: '/harbor/projects' },
            });
        }
    ));

    it('should let a guest see the projects without signing in', inject(
        [AuthCheckGuard, Router],
        (guard: AuthCheckGuard, router: Router) => {
            spyOn(fakeSessionService, 'isGuest').and.returnValue(true);
            const navigate = spyOn(router, 'navigate');
            expect(activate(guard)).toBeTrue();
            expect(
                activate(guard, '/harbor/projects/1/repositories/a%2Fb')
            ).toBeTrue();
            expect(navigate).not.toHaveBeenCalled();
        }
    ));

    it('should send a guest from other pages to the projects', inject(
        [AuthCheckGuard, Router],
        (guard: AuthCheckGuard, router: Router) => {
            spyOn(fakeSessionService, 'isGuest').and.returnValue(true);
            const navigate = spyOn(router, 'navigate').and.resolveTo(true);
            for (const url of ['/harbor/logs', '/harbor/users']) {
                navigate.calls.reset();
                expect(activate(guard, url)).toBeFalse();
                expect(navigate).toHaveBeenCalledWith(['/harbor/projects']);
            }
        }
    ));
});
