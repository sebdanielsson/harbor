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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignInComponent } from './sign-in.component';
import { AppConfigService } from '../../services/app-config.service';
import { SessionService } from '../../shared/services/session.service';
import { CookieService } from 'ngx-cookie';
import { SkinableConfig } from '../../services/skinable-config.service';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { throwError as observableThrowError } from 'rxjs/internal/observable/throwError';
import {
    HttpErrorResponse,
    HttpHeaders,
    HttpResponse,
} from '@angular/common/http';
import { UserPermissionService } from '../../shared/services';
import { RouterTestingModule } from '@angular/router/testing';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../../../ng-swagger-gen/services/project.service';

describe('SignInComponent', () => {
    let component: SignInComponent;
    let fixture: ComponentFixture<SignInComponent>;
    const mockedSessionService = {
        signIn() {
            return of(true);
        },
        getCurrentUser() {
            return {};
        },
        setGuest(guest: boolean) {},
    };
    const mockedUserPermissionService = {
        clearPermissionCache() {},
    };
    // The number of public projects an anonymous user can see
    let publicProjectCount: number;
    const mockedProjectService = {
        listProjectsResponse() {
            return of(
                new HttpResponse({
                    headers: new HttpHeaders({
                        'X-Total-Count': String(publicProjectCount),
                    }),
                    body: [],
                })
            );
        },
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot(),
                RouterTestingModule,
                ClarityModule,
                FormsModule,
            ],
            declarations: [SignInComponent],
            providers: [
                TranslateService,
                {
                    provide: UserPermissionService,
                    useValue: mockedUserPermissionService,
                },
                { provide: SessionService, useValue: mockedSessionService },
                { provide: ProjectService, useValue: mockedProjectService },
                {
                    provide: AppConfigService,
                    useValue: {
                        load: function () {
                            return of({});
                        },
                        isIntegrationMode() {},
                        getConfig() {
                            return {};
                        },
                    },
                },
                {
                    provide: CookieService,
                    useValue: {
                        get: function (key) {
                            return key;
                        },
                    },
                },
                {
                    provide: SkinableConfig,
                    useValue: {
                        getSkinConfig: function () {
                            return {
                                loginBgImg: 'abc',
                                appTitle: 'Harbor',
                            };
                        },
                    },
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        publicProjectCount = 1;
        fixture = TestBed.createComponent(SignInComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should offer to continue as a guest when there are public projects', () => {
        expect(
            fixture.nativeElement.querySelector('#continue_as_guest')
        ).toBeTruthy();
    });

    it('should not offer to continue as a guest without public projects', () => {
        publicProjectCount = 0;
        fixture = TestBed.createComponent(SignInComponent);
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector('#continue_as_guest')
        ).toBeFalsy();
    });

    it('should not offer to continue as a guest when the projects cannot be listed', () => {
        spyOn(mockedProjectService, 'listProjectsResponse').and.returnValue(
            observableThrowError(new HttpErrorResponse({ status: 500 }))
        );
        fixture = TestBed.createComponent(SignInComponent);
        fixture.detectChanges();
        expect(
            fixture.nativeElement.querySelector('#continue_as_guest')
        ).toBeFalsy();
    });

    it('should continue as a guest to the default page', () => {
        const setGuest = spyOn(mockedSessionService, 'setGuest');
        const clearCache = spyOn(
            mockedUserPermissionService,
            'clearPermissionCache'
        );
        const navigate = spyOn(
            TestBed.inject(Router),
            'navigateByUrl'
        ).and.resolveTo(true);
        fixture.nativeElement.querySelector('#continue_as_guest').click();
        expect(clearCache).toHaveBeenCalled();
        expect(setGuest).toHaveBeenCalledWith(true);
        expect(navigate).toHaveBeenCalledWith('/harbor/projects');
    });

    it('should continue as a guest to the page that asked for sign-in', () => {
        const navigate = spyOn(
            TestBed.inject(Router),
            'navigateByUrl'
        ).and.resolveTo(true);
        component.redirectUrl = '/harbor/projects/1/repositories';
        component.continueAsGuest();
        expect(navigate).toHaveBeenCalledWith(
            '/harbor/projects/1/repositories'
        );
    });

    it('should apply the theme color to the default login background', () => {
        component.customLoginBgImg = '';
        fixture.detectChanges();

        const loginWrapper: HTMLDivElement =
            fixture.nativeElement.querySelector('.login-wrapper');
        expect(loginWrapper.style.backgroundColor).toBe(
            'var(--clr-login-background-color)'
        );
        expect(loginWrapper.style.backgroundBlendMode).toBe('multiply');
    });

    it('should not apply theme blending to a custom login background', () => {
        const loginWrapper: HTMLDivElement =
            fixture.nativeElement.querySelector('.login-wrapper');
        expect(loginWrapper.style.backgroundImage).toContain(
            'url("/images/abc")'
        );
        expect(loginWrapper.style.backgroundColor).toBe('');
        expect(loginWrapper.style.backgroundBlendMode).toBe('');
    });

    it('should show core service is not available', async () => {
        expect(component).toBeTruthy();
        const sessionService = TestBed.inject<SessionService>(SessionService);
        const spy: jasmine.Spy = spyOn(
            sessionService,
            'signIn'
        ).and.returnValue(
            observableThrowError(
                new HttpErrorResponse({
                    error: 'test 501 error',
                    status: 501,
                })
            )
        );
        signIn();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(spy.calls.count()).toEqual(1);
        const errorSpan: HTMLSpanElement =
            fixture.nativeElement.querySelector('.error>span');
        expect(errorSpan.innerText).toEqual(
            'SIGN_IN.CORE_SERVICE_NOT_AVAILABLE'
        );
    });
    it('should show invalid username or password', async () => {
        expect(component).toBeTruthy();
        const sessionService = TestBed.inject<SessionService>(SessionService);
        const spy: jasmine.Spy = spyOn(
            sessionService,
            'signIn'
        ).and.returnValue(
            observableThrowError(
                new HttpErrorResponse({
                    error: 'test 404 error',
                    status: 404,
                    statusText: 'Not Found',
                })
            )
        );
        signIn();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(spy.calls.count()).toEqual(1);
        const errorSpan: HTMLSpanElement =
            fixture.nativeElement.querySelector('.error>span');
        expect(errorSpan.innerText).toEqual('SIGN_IN.INVALID_MSG');
    });
    function signIn() {
        const nameInput: HTMLInputElement =
            fixture.nativeElement.querySelector('#login_username');
        nameInput.value = 'admin';
        nameInput.dispatchEvent(new Event('input'));
        const passwordInput: HTMLInputElement =
            fixture.nativeElement.querySelector('#login_password');
        passwordInput.value = 'Harbor12345';
        passwordInput.dispatchEvent(new Event('input'));
        const signButton: HTMLAnchorElement =
            fixture.nativeElement.querySelector('#log_in');
        signButton.click();
    }
});
