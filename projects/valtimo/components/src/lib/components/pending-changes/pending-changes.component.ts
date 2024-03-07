/*
 * Copyright 2015-2023 Ritense BV, the Netherlands.
 *
 * Licensed under EUPL, Version 1.2 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {ComponentRef, inject} from '@angular/core';
import {UrlTree} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {ModalButtonType, ModalService} from 'carbon-components-angular';
import {Observable, Subject} from 'rxjs';
import {PendingChangesService} from './pending-changes.service';

export class PendingChangesComponent {
  private _activeModal: ComponentRef<any> | null = null;
  private _modalService: ModalService;
  private _pendingChangesService: PendingChangesService;
  private _translateService: TranslateService;

  protected set pendingChanges(value: boolean) {
    this._pendingChangesService.pendingChanges = value;
  }

  protected get pendingChanges(): boolean {
    return this._pendingChangesService.pendingChanges;
  }

  constructor() {
    this._modalService = inject(ModalService);
    this._pendingChangesService = inject(PendingChangesService);
    this._translateService = inject(TranslateService);
  }

  public canDeactivate():
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (!this.pendingChanges) {
      return true;
    }

    const deactivateSubject = new Subject<boolean>();

    if (!!this._activeModal) {
      return false;
    }

    this._activeModal = this._modalService.show({
      title: this._translateService.instant('interface.pendingChanges.title'),
      content: this._translateService.instant('interface.pendingChanges.content'),
      showCloseButton: false,
      buttons: [
        {
          text: this._translateService.instant('interface.cancel'),
          type: ModalButtonType.secondary,
          click: () => {
            this.onCancelRedirect();
            deactivateSubject.next(false);
            this._activeModal = null;
          },
        },
        {
          text: this._translateService.instant('interface.confirm'),
          type: ModalButtonType.primary,
          click: () => {
            this.onConfirmRedirect();
            deactivateSubject.next(true);
            this._activeModal = null;
            this.pendingChanges = false;
          },
        },
      ],
      close: () => false,
    });

    return deactivateSubject;
  }

  protected onCancelRedirect(): void {}

  protected onConfirmRedirect(): void {}
}
