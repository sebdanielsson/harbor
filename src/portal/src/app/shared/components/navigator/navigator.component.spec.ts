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
import { SessionService } from '../../services/session.service';
import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { NavigatorComponent } from './navigator.component';
import { CookieService } from 'ngx-cookie';
import { AppConfigService } from '../../../services/app-config.service';
import { MessageHandlerService } from '../../services/message-handler.service';
import { SearchTriggerService } from '../global-search/search-trigger.service';
import { SkinableConfig } from '../../../services/skinable-config.service';
import { SharedTestingModule } from '../../shared.module';
import { Router } from '@angular/router';

describe('NavigatorComponent', () => {
    let component: TestComponentWrapperComponent;
    let fixture: ComponentFixture<TestComponentWrapperComponent>;
    let fakeSessionService = {
        getCurrentUser: function () {
            return {
                username: 'abc',
                has_admin_role: true,
            };
        },
        isGuest: function () {
            return false;
        },
    };
    let fakePlatformLocation = null;
    let fakeCookieService = null;
    let fakeAppConfigService = {
        isIntegrationMode: function () {
            return true;
        },
        getConfig: function () {
            return {
                has_ca_root: true,
                read_only: false,
            };
        },
        getAdmiralEndpoint: function () {},
    };
    let fakeMessageHandlerService = null;
    let fakeSkinableConfig = {
        getSkinConfig: function () {
            return { projects: 'abc' };
        },
    };
    let fakeSearchTriggerService = {
        searchClearChan$: {
            subscribe: function () {},
        },
        triggerSearch() {
            return undefined;
        },
        closeSearch(close: boolean) {},
    };
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SharedTestingModule],
            declarations: [NavigatorComponent, TestComponentWrapperComponent],
            providers: [
                { provide: SessionService, useValue: fakeSessionService },
                { provide: PlatformLocation, useValue: fakePlatformLocation },
                { provide: CookieService, useValue: fakeCookieService },
                { provide: AppConfigService, useValue: fakeAppConfigService },
                {
                    provide: MessageHandlerService,
                    useValue: fakeMessageHandlerService,
                },
                {
                    provide: SearchTriggerService,
                    useValue: fakeSearchTriggerService,
                },
                { provide: SkinableConfig, useValue: fakeSkinableConfig },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestComponentWrapperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should not offer a guest log-in to a signed-in user', () => {
        expect(fixture.nativeElement.querySelector('#guestLogIn')).toBeFalsy();
    });

    it('should let a guest log in and come back to the same page', () => {
        spyOn(fakeSessionService, 'getCurrentUser').and.returnValue(null);
        spyOn(fakeSessionService, 'isGuest').and.returnValue(true);
        const router = TestBed.inject(Router);
        spyOnProperty(router, 'url').and.returnValue(
            '/harbor/projects/1/repositories?publicAndNotLogged=yes'
        );
        fixture.detectChanges();
        const navigate = spyOn(router, 'navigate').and.resolveTo(true);
        fixture.nativeElement.querySelector('#guestLogIn').click();
        expect(navigate).toHaveBeenCalledWith(['/account/sign-in'], {
            queryParams: { redirect_url: '/harbor/projects/1/repositories' },
        });
    });

    it('should not offer a guest log-in on the sign-in page', () => {
        spyOn(fakeSessionService, 'getCurrentUser').and.returnValue(null);
        spyOn(fakeSessionService, 'isGuest').and.returnValue(true);
        spyOnProperty(TestBed.inject(Router), 'url').and.returnValue(
            '/account/sign-in?redirect_url=%2Fharbor%2Fprojects'
        );
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('#guestLogIn')).toBeFalsy();
    });
});

// clr-header should only be used inside of a clr-main-container
@Component({
    selector: 'test-component-wrapper',
    template:
        '<clr-main-container><navigator></navigator></clr-main-container>',
    standalone: false,
})
class TestComponentWrapperComponent {}
