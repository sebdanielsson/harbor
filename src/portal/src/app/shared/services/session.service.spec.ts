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
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { GUEST_STORAGE_KEY, SessionService } from './session.service';
import {
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http';
import { JobServiceDashboardHealthCheckService } from '../../base/left-side-nav/job-service-dashboard/job-service-dashboard-health-check.service';
import { SessionUser } from '../entities/session-user';

describe('SessionService', () => {
    beforeEach(() => {
        sessionStorage.removeItem(GUEST_STORAGE_KEY);
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                SessionService,
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
    });

    afterEach(() => {
        sessionStorage.removeItem(GUEST_STORAGE_KEY);
    });

    it('should be created', inject(
        [SessionService],
        (service: SessionService) => {
            expect(service).toBeTruthy();
        }
    ));

    it('should not be a guest by default', inject(
        [SessionService],
        (service: SessionService) => {
            expect(service.isGuest()).toBeFalse();
        }
    ));

    it('should keep a guest in this browser tab', inject(
        [SessionService],
        (service: SessionService) => {
            service.setGuest(true);
            expect(service.isGuest()).toBeTrue();
            expect(sessionStorage.getItem(GUEST_STORAGE_KEY)).toEqual('true');
            // as after a reload
            const reloaded = new SessionService(null, null, null);
            expect(reloaded.isGuest()).toBeTrue();

            service.setGuest(false);
            expect(service.isGuest()).toBeFalse();
            expect(sessionStorage.getItem(GUEST_STORAGE_KEY)).toBeNull();
        }
    ));

    it('should never treat a signed-in user as a guest', inject(
        [SessionService],
        (service: SessionService) => {
            service.setGuest(true);
            service.currentUser = { username: 'user' } as SessionUser;
            expect(service.isGuest()).toBeFalse();
        }
    ));

    it('should stop being a guest after signing in', inject(
        [
            SessionService,
            HttpTestingController,
            JobServiceDashboardHealthCheckService,
        ],
        (
            service: SessionService,
            http: HttpTestingController,
            healthCheck: JobServiceDashboardHealthCheckService
        ) => {
            spyOn(healthCheck, 'checkHealth');
            service.setGuest(true);
            service.retrieveUser().subscribe();
            http.expectOne('/api/v2.0/users/current').flush({
                user_id: 3,
                username: 'user',
            });
            service.currentUser = null;
            expect(service.isGuest()).toBeFalse();
            expect(sessionStorage.getItem(GUEST_STORAGE_KEY)).toBeNull();
        }
    ));
});
