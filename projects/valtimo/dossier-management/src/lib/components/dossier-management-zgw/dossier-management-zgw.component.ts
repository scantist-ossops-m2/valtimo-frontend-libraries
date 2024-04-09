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
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {CaseStatusService, ConfiguredColumn, ConfiguredColumnUtils, ZgwDocumentColumnService} from '@valtimo/document';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {
  ActionItem,
  ColumnConfig,
  MoveRowDirection,
  MoveRowEvent, PendingChangesComponent,
  ViewType,
} from '@valtimo/components';
import {StatusModalCloseEvent, StatusModalType, TabEnum} from '../../models';
import {TabService} from '../../services';
import {DossierManagementDocumentDefinitionComponent} from '../dossier-management-document-definition/dossier-management-document-definition.component';

@Component({
  selector: 'valtimo-dossier-management-zgw',
  templateUrl: './dossier-management-zgw.component.html',
  styleUrls: ['./dossier-management-zgw.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DossierManagementZgwComponent extends PendingChangesComponent implements AfterViewInit {
  @ViewChild('colorColumnTemplate') colorColumnTemplate: TemplateRef<any>;
  private _documentDefinitionTab: DossierManagementDocumentDefinitionComponent;

  private readonly _reload$ = new BehaviorSubject<null | 'noAnimation'>(null);

  private readonly _documentDefinitionName$: Observable<string> = this.route.params.pipe(
    map(params => params?.name),
    filter(docDefName => !!docDefName)
  );

  public get documentDefinitionName$(): Observable<string> {
    return this._documentDefinitionName$;
  }

  public readonly loading$ = new BehaviorSubject<boolean>(true);

  public readonly usedKeys$ = new BehaviorSubject<string[]>([]);

  private _documentStatuses: ConfiguredColumn[] = [];

  public readonly documentStatuses$ = combineLatest([
    this._documentDefinitionName$,
    this._reload$,
  ]).pipe(
    tap(([_, reload]) => {
      if (reload === null) {
        this.loading$.next(true);
      }
    }),
    switchMap(([documentDefinitionName]) =>
      this.caseStatusService.getConfiguredColumnesManagement(documentDefinitionName)
    ),
    map(statuses =>
      statuses.map(status => ({
        ...status,
        tagType: ConfiguredColumnUtils.getTagTypeFromConfiguredColumnColor(status.color),
      }))
    ),
    tap(statuses => {
      this._documentStatuses = statuses;
      this.usedKeys$.next(statuses.map(status => status.key));
      this.loading$.next(false);
    })
  );

  public readonly fields$ = new BehaviorSubject<ColumnConfig[]>([]);

  public readonly ACTION_ITEMS: ActionItem[] = [
    {
      label: 'interface.edit',
      callback: this.openEditModal.bind(this),
      type: 'normal',
    },
    {
      label: 'interface.delete',
      callback: this.openDeleteModal.bind(this),
      type: 'danger',
    },
  ];

  public readonly CARBON_THEME = 'g10';

  public readonly statusModalType$ = new BehaviorSubject<StatusModalType>('closed');
  public readonly prefillStatus$ = new BehaviorSubject<ConfiguredColumn>(undefined);

  public readonly columnToUpdate$ = new BehaviorSubject<ConfiguredColumn>(undefined);
  public readonly showDisableModal$ = new Subject<boolean>();

  public _activeTab: TabEnum;

  public currentTab$ = this.tabService.currentTab$.pipe(
    tap((currentTab: TabEnum) => {
      this._activeTab = currentTab;
    })
  );

  constructor(
    private readonly caseStatusService: CaseStatusService,
    private readonly route: ActivatedRoute,
    private readonly tabService: TabService,
    private readonly zgwDocumentColumnService: ZgwDocumentColumnService
  ) {
    super();

    this._documentDefinitionName$.subscribe((documentDefinitionName) => {
      zgwDocumentColumnService.getConfiguredColumns(documentDefinitionName).subscribe((configuredColumns) => {
        console.log(configuredColumns);
      }, (error) => {
        console.error(error);
      });
    });
  }

  public ngAfterViewInit(): void {
    this.initFields();
  }

  public openDeleteModal(status: ConfiguredColumn): void {
    this.columnToUpdate$.next(status);
    this.showDisableModal$.next(true);
  }

  public openEditModal(status: ConfiguredColumn): void {
    this.prefillStatus$.next(status);
    this.statusModalType$.next('edit');
  }

  public openAddModal(): void {
    this.statusModalType$.next('add');
  }

  public closeModal(closeModalEvent: StatusModalCloseEvent): void {
    if (closeModalEvent === 'closeAndRefresh') {
      this.reload();
    }

    this.statusModalType$.next('closed');
  }

  public confirmDeleteStatus(status: ConfiguredColumn): void {
    this.documentDefinitionName$
      .pipe(
        switchMap(documentDefinitionName =>
          this.caseStatusService.deleteConfiguredColumn(documentDefinitionName, status.key)
        )
      )
      .subscribe(() => {
        this.reload();
      });
  }

  public onMoveRowClick(event: MoveRowEvent): void {
    const {direction, index} = event;

    const orderedStatuses: ConfiguredColumn[] =
      direction === MoveRowDirection.UP
        ? this.swapStatuses(this._documentStatuses, index - 1, index)
        : this.swapStatuses(this._documentStatuses, index, index + 1);

    this.documentDefinitionName$
      .pipe(
        switchMap(documentDefinitionName =>
          this.caseStatusService.updateConfiguredColumnes(documentDefinitionName, orderedStatuses)
        )
      )
      .subscribe(() => {
        this.reload(true);
      });
  }

  public displayBodyComponent(tab: TabEnum): void {
    if (this.pendingChanges) {
      this.onCanDeactivate();
    }
    this.tabService.currentTab = tab;
  }

  private reload(noAnimation = false): void {
    this._reload$.next(noAnimation ? 'noAnimation' : null);
  }

  private swapStatuses(
    statuses: ConfiguredColumn[],
    index1: number,
    index2: number
  ): ConfiguredColumn[] {
    const temp = [...statuses];
    temp[index1] = temp.splice(index2, 1, temp[index1])[0];

    return temp;
  }

  private initFields(): void {
    this.fields$.next([
      {
        key: 'title',
        label: 'dossierManagement.statuses.columns.title',
        viewType: ViewType.TEXT,
      },
      {
        key: 'key',
        label: 'dossierManagement.statuses.columns.key',
        viewType: ViewType.TEXT,
      },
      {
        key: 'visibleInCaseListByDefault',
        label: 'dossierManagement.statuses.columns.visible',
        viewType: ViewType.BOOLEAN,
      },
      {
        viewType: ViewType.TEMPLATE,
        template: this.colorColumnTemplate,
        key: 'color',
        label: 'dossierManagement.statuses.columns.color',
      },
    ]);
  }

  protected onCanDeactivate(): void {
    this._documentDefinitionTab.onCanDeactivate();
  }

  protected readonly TabEnum = TabEnum;
}
