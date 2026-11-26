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
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { MemberGuard } from './member-guard-activate.service';
import { ProjectService } from '../services';

describe('MemberGuard', () => {
    // A visitor who hasn't signed in and can't see the project
    const fakeSessionService = {
        getCurrentUser: () => null,
        setProjectMembers: () => {},
        clear: () => {},
        isGuest: () => false,
    };
    const fakeProjectService = {
        getProjectFromCache: () =>
            throwError(() => new HttpErrorResponse({ status: 401 })),
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            providers: [
                MemberGuard,
                { provide: SessionService, useValue: fakeSessionService },
                { provide: ProjectService, useValue: fakeProjectService },
            ],
        });
    });

    function hasProjectPerm(guard: MemberGuard): boolean {
        const route = { queryParams: {} } as ActivatedRouteSnapshot;
        let result: boolean;
        guard
            .hasProjectPerm('/harbor/projects/1/repositories', 1, route)
            .subscribe(r => (result = r));
        return result;
    }

    it('should ...', inject([MemberGuard], (guard: MemberGuard) => {
        expect(guard).toBeTruthy();
    }));

    it('should send a visitor who is not signed in to sign-in', inject(
        [MemberGuard, Router],
        (guard: MemberGuard, router: Router) => {
            const navigate = spyOn(router, 'navigate').and.resolveTo(true);
            expect(hasProjectPerm(guard)).toBeFalse();
            expect(navigate.calls.mostRecent().args[0]).toEqual([
                '/account/sign-in',
            ]);
        }
    ));

    it('should send a guest to the projects it can see', inject(
        [MemberGuard, Router],
        (guard: MemberGuard, router: Router) => {
            spyOn(fakeSessionService, 'isGuest').and.returnValue(true);
            const navigate = spyOn(router, 'navigate').and.resolveTo(true);
            expect(hasProjectPerm(guard)).toBeFalse();
            expect(navigate).toHaveBeenCalledWith(['/harbor/projects']);
        }
    ));
});
