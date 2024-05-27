/*
 * Copyright 2015-2024 Ritense BV, the Netherlands.
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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import {NotificationService} from 'carbon-components-angular';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {CARBON_CONSTANTS} from '@valtimo/components';
import {WidgetTabItem} from '../../models/widget-tab-item.type';
import {WidgetTabManagementService} from '../../services';

@Component({
  selector: 'valtimo-dossier-management-widget-tab-edit-modal',
  templateUrl: './dossier-management-widget-tab-edit-modal.html',
  styleUrls: ['./dossier-management-widget-tab-edit-modal.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [NotificationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DossierManagementWidgetTabEditModalComponent implements OnInit, OnDestroy {
  @Input() public showModal$: Observable<boolean>;
  @Input() public widgetTab: WidgetTabItem;
  @Output() public saveEvent = new EventEmitter<any>();

  public readonly open$ = new BehaviorSubject<boolean>(false);
  public readonly disabled$ = new BehaviorSubject<boolean>(false);
  public readonly editWidgetTabForm = this.fb.group({
    name: this.fb.control('', [Validators.required]),
  });

  public get widgetTabName(): AbstractControl<string, string> {
    return this.editWidgetTabForm.get('name');
  }

  private _openSubscription!: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly widgetTabManagementService: WidgetTabManagementService
  ) {}

  public ngOnInit(): void {
    this.openOpenSubscription();
  }

  public ngOnDestroy(): void {
    this._openSubscription?.unsubscribe();
  }

  public closeModal(): void {
    this.open$.next(false);

    setTimeout(() => {
      this.editWidgetTabForm.reset();
    }, CARBON_CONSTANTS.modalAnimationMs);
  }

  public saveWidgetTab(): void {
    this.disable();

    this.widgetTabManagementService
      .updateWidgetTab({
        caseDefinitionName: this.widgetTab.caseDefinitionName,
        key: this.widgetTab.key,
        name: this.widgetTabName.value,
      })
      .subscribe(() => {
        this.saveEvent.emit();
        this.closeModal();
      });
  }

  private setEditWidgetTabForm(): void {
    if (this.widgetTab) {
      this.widgetTabName?.setValue(this.widgetTab.name);
    }

    this.enable();
  }

  private openOpenSubscription(): void {
    this._openSubscription = this.showModal$.subscribe(show => {
      this.setEditWidgetTabForm();
      this.open$.next(show);
    });
  }

  private disable(): void {
    this.disabled$.next(true);
  }

  private enable(): void {
    this.disabled$.next(false);
  }
}