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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {BehaviorSubject, combineLatest, map, Observable} from 'rxjs';
import {InternalCaseStatus} from '@valtimo/document';
import {CheckboxModule, DropdownModule, InputModule, ListItem} from 'carbon-components-angular';
import {CARBON_THEME} from '../../models';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {distinctUntilChanged, filter, take} from 'rxjs/operators';
import {isEqual} from 'lodash';

@Component({
  selector: 'valtimo-status-selector',
  templateUrl: './status-selector.component.html',
  styleUrls: ['./status-selector.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DropdownModule, CheckboxModule, InputModule, TranslateModule],
})
export class StatusSelectorComponent {
  @Input() public set statuses(value: InternalCaseStatus[]) {
    this._statuses$.next(value);
  }
  @Input() public set selectedStatuses(value: InternalCaseStatus[]) {
    this._selectedStatuses$.next(value);
  }
  @Input() public carbonTheme: CARBON_THEME = CARBON_THEME.WHITE;
  @Input() public disabled!: boolean;

  @Output() public selectedStatusesChangeEvent = new EventEmitter<InternalCaseStatus[]>();

  private readonly _statuses$ = new BehaviorSubject<InternalCaseStatus[]>([]);

  private readonly _selectedStatuses$ = new BehaviorSubject<InternalCaseStatus[]>([]);

  public readonly listItems$: Observable<ListItem[]> = combineLatest([
    this._statuses$,
    this._selectedStatuses$,
  ]).pipe(
    filter(([statuses, selectedStatuses]) => !!statuses && !!selectedStatuses),
    map(([statuses, selectedStatuses]) =>
      statuses.map(status => ({
        content: status.title,
        selected: !!selectedStatuses.find(selectedStatus => selectedStatus.key === status.key),
        key: status.key,
      }))
    ),
    distinctUntilChanged((previous, current) => isEqual(previous, current))
  );

  public itemSelected(event: ListItem[]): void {
    const newSelectedItems = event?.filter(item => item?.selected) || [];

    this._statuses$.pipe(take(1)).subscribe(statuses => {
      const newSelectedStatuses = newSelectedItems.map(item =>
        statuses.find(status => status.key === item.key)
      );

      this.selectedStatusesChangeEvent.emit(newSelectedStatuses);
    });
  }
}
