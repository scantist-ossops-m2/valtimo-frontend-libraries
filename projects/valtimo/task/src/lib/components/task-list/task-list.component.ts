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
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {Router} from '@angular/router';
import {TaskService} from '../../services/task.service';
import moment from 'moment';
import {
  MappedSpecifiedTask,
  SpecifiedTask,
  Task,
  TaskListParams,
  TaskPageParams,
} from '../../models';
import {TaskDetailModalComponent} from '../task-detail-modal/task-detail-modal.component';
import {BehaviorSubject, combineLatest, Observable, of, switchMap, tap} from 'rxjs';
import {ConfigService, Page, SortState, TaskListTab} from '@valtimo/config';
import {DocumentService} from '@valtimo/document';
import {distinctUntilChanged, filter, map, take} from 'rxjs/operators';
import {PermissionService} from '@valtimo/access-control';
import {
  CAN_VIEW_CASE_PERMISSION,
  CAN_VIEW_TASK_PERMISSION,
  TASK_DETAIL_PERMISSION_RESOURCE,
} from '../../task-permissions';
import {TaskListColumnService, TaskListPaginationService, TaskListService} from '../../services';
import {isEqual} from 'lodash';
import {ListItem} from 'carbon-components-angular';
import {TranslateService} from '@ngx-translate/core';
import {TaskListSortService} from '../../services/task-list-sort.service';

moment.locale(localStorage.getItem('langKey') || '');

@Component({
  selector: 'valtimo-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    TaskListService,
    TaskListColumnService,
    TaskListPaginationService,
    TaskListSortService,
  ],
})
export class TaskListComponent implements OnInit {
  @ViewChild('taskDetail') private readonly _taskDetail: TaskDetailModalComponent;

  public readonly selectedTaskType$ = this.taskListService.selectedTaskType$;
  public readonly fields$ = this.taskListColumnService.fields$;
  public readonly loadingTasks$ = new BehaviorSubject<boolean>(true);
  public readonly visibleTabs$ = new BehaviorSubject<Array<TaskListTab> | null>(null);

  private _enableLoadingAnimation$ = new BehaviorSubject<boolean>(true);

  public readonly cachedTasks$ = new BehaviorSubject<Task[] | MappedSpecifiedTask[] | null>(null);

  public readonly paginationForCurrentTaskTypeForList$ =
    this.taskListPaginationService.paginationForCurrentTaskTypeForList$;

  public readonly sortStateForCurrentTaskType$ =
    this.taskListSortService.sortStateForCurrentTaskType$;

  private readonly _reload$ = new BehaviorSubject<boolean>(true);

  public readonly tasks$: Observable<Task[] | MappedSpecifiedTask[]> = combineLatest([
    this.taskListService.loadingStateForCaseDefinition$,
    this.selectedTaskType$,
    this.taskListPaginationService.paginationForCurrentTaskType$,
    this.taskListSortService.sortStringForCurrentTaskType$,
    this.taskListService.caseDefinitionName$,
    this._enableLoadingAnimation$,
    this._reload$,
  ]).pipe(
    filter(([loadingStateForCaseDefinition]) => loadingStateForCaseDefinition === false),
    map(
      ([
        _,
        selectedTaskType,
        paginationForSelectedTaskType,
        sortStringForSelectedTaskType,
        caseDefinitionName,
        enableLoadingAnimation,
        reload,
      ]) =>
        this.getTaskListParams(
          paginationForSelectedTaskType,
          sortStringForSelectedTaskType,
          selectedTaskType,
          caseDefinitionName,
          enableLoadingAnimation,
          reload
        )
    ),
    distinctUntilChanged((previous, current) => isEqual(previous.params, current.params)),
    tap(({enableLoadingAnimation}) => {
      if (enableLoadingAnimation) this.loadingTasks$.next(true);
    }),
    switchMap(({params}) =>
      combineLatest([
        this.taskService.queryTasksPageV3(
          params.selectedTaskType,
          params.params,
          params.caseDefinitionName
        ),
        of(!!params.caseDefinitionName),
      ])
    ),
    switchMap(([tasksResult, isSpecified]) =>
      this.getTaskListPermissionsRequest(tasksResult, isSpecified)
    ),
    map(([isSpecified, taskResult, canViewTaskPermissions, canViewCasePermissions]) => {
      this.updateTaskListPaginationAfterResponse(Number(taskResult.totalElements));

      return this.mapTasksForList(
        isSpecified,
        taskResult,
        canViewTaskPermissions,
        canViewCasePermissions
      );
    }),
    tap(tasks => {
      this.cachedTasks$.next(tasks);
      this.loadingTasks$.next(false);
      this.disableLoadingAnimation();
    })
  );

  public readonly loadingCaseListItems$ = new BehaviorSubject<boolean>(true);
  private readonly _selectedCaseDefinitionId$ = new BehaviorSubject<string>(
    this.taskListService.ALL_CASES_ID
  );
  public readonly caseListItems$: Observable<ListItem[]> = combineLatest([
    this.documentService.getAllDefinitions(),
    this._selectedCaseDefinitionId$,
    this.translateService.stream('key'),
  ]).pipe(
    map(([documentDefinitionRes, selectedCaseDefinitionId]) => [
      {
        content: this.translateService.instant('task-list.allCases'),
        id: this.taskListService.ALL_CASES_ID,
        selected: selectedCaseDefinitionId === this.taskListService.ALL_CASES_ID,
      },
      ...documentDefinitionRes.content.map(documentDefinition => ({
        id: documentDefinition.id.name,
        content: documentDefinition?.schema?.title,
        selected: documentDefinition.id.name === selectedCaseDefinitionId,
      })),
    ]),
    tap(() => this.loadingCaseListItems$.next(false))
  );

  public readonly taskListColumnsForCase$ = this.taskListColumnService.taskListColumnsForCase$;

  private readonly _DEFAULT_TASK_LIST_TABS: TaskListTab[] = [
    TaskListTab.MINE,
    TaskListTab.OPEN,
    TaskListTab.ALL,
  ];

  constructor(
    private readonly configService: ConfigService,
    private readonly documentService: DocumentService,
    private readonly permissionService: PermissionService,
    private readonly router: Router,
    private readonly taskService: TaskService,
    private readonly taskListService: TaskListService,
    private readonly translateService: TranslateService,
    private readonly taskListColumnService: TaskListColumnService,
    private readonly taskListPaginationService: TaskListPaginationService,
    private readonly taskListSortService: TaskListSortService
  ) {}

  public ngOnInit(): void {
    this.taskListColumnService.resetTaskListFields();
    this.setVisibleTabs();
  }

  public paginationClicked(page: number, type: TaskListTab | string): void {
    this.taskListPaginationService.updateTaskPagination(type as TaskListTab, {page: page - 1});
  }

  public paginationSet(newSize: number): void {
    combineLatest([
      this.taskListPaginationService.paginationForCurrentTaskType$,
      this.taskListService.selectedTaskType$,
    ])
      .pipe(take(1))
      .subscribe(([pagination, selectedTaskType]) => {
        this.taskListPaginationService.updateTaskPagination(selectedTaskType, {
          size: Number(newSize),
          page: this.taskListPaginationService.getLastAvailablePage(
            pagination.page,
            Number(newSize),
            pagination.collectionSize
          ),
        });
      });
  }

  public tabChange(tab: TaskListTab | string): void {
    this.taskListService.selectedTaskType$.pipe(take(1)).subscribe(selectedTaskType => {
      if (selectedTaskType !== tab) {
        this.enableLoadingAnimation();
        this.taskListService.setSelectedTaskType(tab as TaskListTab);
        this.taskListPaginationService.updateTaskPagination(tab as TaskListTab, {page: 0});
      }
    });
  }

  public openRelatedCase(event: MouseEvent, index: number): void {
    event.stopPropagation();

    this.cachedTasks$.pipe(take(1)).subscribe(cachedTasks => {
      const currentTask = cachedTasks && cachedTasks[index];

      if (currentTask && !currentTask.caseLocked) {
        this.documentService
          .getDocument(currentTask.businessKey)
          .pipe(take(1))
          .subscribe(document => {
            this.router.navigate([
              `/dossiers/${document.definitionId?.name}/document/${currentTask.businessKey}`,
            ]);
          });
      }
    });
  }

  public rowOpenTaskClick(task): void | boolean {
    return !task.endTime && !task.locked ? this._taskDetail.openTaskDetails(task) : false;
  }

  public sortChanged(sortState: SortState): void {
    this.taskListSortService.updateSortState(this.taskListService.selectedTaskType, sortState);
  }

  public setCaseDefinition(definition: {item: {id: string}}): void {
    if (definition.item.id) {
      this.loadingTasks$.next(true);
      this.taskListService.setCaseDefinitionName(definition.item.id);
    }
  }

  public reload(): void {
    this.enableLoadingAnimation();
    this._reload$.next(!this._reload$.getValue());
  }

  private updateTaskListPaginationAfterResponse(newCollectionSize: number): void {
    this.taskListPaginationService.paginationForCurrentTaskType$
      .pipe(take(1))
      .subscribe(currentPagination => {
        this.taskListPaginationService.updateTaskPagination(this.taskListService.selectedTaskType, {
          collectionSize: Number(newCollectionSize),
          page: this.taskListPaginationService.getLastAvailablePage(
            currentPagination.page,
            currentPagination.size,
            newCollectionSize
          ),
        });
      });
  }

  private setVisibleTabs(): void {
    const visibleTabs = this.configService.config?.visibleTaskListTabs;

    if (visibleTabs) {
      this.visibleTabs$.next(visibleTabs);
      this.taskListService.setSelectedTaskType(visibleTabs[0]);
    } else {
      this.visibleTabs$.next(this._DEFAULT_TASK_LIST_TABS);
      this.taskListService.setSelectedTaskType(this._DEFAULT_TASK_LIST_TABS[0]);
    }
  }

  private disableLoadingAnimation(): void {
    this._enableLoadingAnimation$.next(false);
  }

  private enableLoadingAnimation(): void {
    this._enableLoadingAnimation$.next(true);
  }

  private getTaskListParams(
    paginationForSelectedTaskType: TaskPageParams,
    sortStringForSelectedTaskType: string,
    selectedTaskType: TaskListTab,
    caseDefinitionName: string,
    enableLoadingAnimation: boolean,
    reload: boolean
  ): TaskListParams {
    const params = {
      ...paginationForSelectedTaskType,
      ...(sortStringForSelectedTaskType && {sort: sortStringForSelectedTaskType}),
    };

    delete params.collectionSize;

    return {
      params: {
        reload,
        selectedTaskType,
        params,
        ...(caseDefinitionName &&
          caseDefinitionName !== this.taskListService.ALL_CASES_ID && {caseDefinitionName}),
      },
      enableLoadingAnimation,
    };
  }

  private getTaskListPermissionsRequest(
    tasksResult: Page<Task> | Page<SpecifiedTask>,
    isSpecified: boolean
  ) {
    const taskResults = tasksResult.content;
    const hasTaskResults = Array.isArray(taskResults) && taskResults.length > 0;

    return combineLatest([
      of(isSpecified),
      of(tasksResult),
      hasTaskResults
        ? combineLatest(
            taskResults.map(task =>
              this.permissionService.requestPermission(CAN_VIEW_TASK_PERMISSION, {
                resource: TASK_DETAIL_PERMISSION_RESOURCE.task,
                identifier: !isSpecified ? (task as Task).id : (task as SpecifiedTask).id,
              })
            )
          )
        : of(null),
      hasTaskResults
        ? combineLatest(
            taskResults.map(task =>
              this.permissionService.requestPermission(CAN_VIEW_CASE_PERMISSION, {
                resource: TASK_DETAIL_PERMISSION_RESOURCE.jsonSchemaDocument,
                identifier: task.businessKey,
              })
            )
          )
        : of(null),
    ]);
  }

  private mapTasksForList(
    isSpecified: boolean,
    tasks: Page<Task> | Page<SpecifiedTask>,
    canViewTaskPermissions: boolean[] | null,
    canViewCasePermissions: boolean[] | null
  ): Task[] | MappedSpecifiedTask[] {
    const MOMENT_FORMAT = 'DD MMM YYYY HH:mm';

    if (isSpecified) {
      return (tasks as Page<SpecifiedTask>).content.map((specifiedTask, specifiedTaskIndex) =>
        specifiedTask.items.reduce(
          (acc, curr) =>
            ({
              id: specifiedTask.id,
              businessKey: specifiedTask.businessKey,
              processInstanceId: specifiedTask.processInstanceId,
              name: specifiedTask.name,
              ...(moment(specifiedTask.created).isValid() && {
                created: moment(specifiedTask.created).format(MOMENT_FORMAT),
              }),
              ...(canViewTaskPermissions && {locked: !canViewTaskPermissions[specifiedTaskIndex]}),
              ...(canViewCasePermissions && {
                caseLocked: !canViewCasePermissions[specifiedTaskIndex],
              }),
              ...acc,
              [curr.key]: curr.value,
            }) as MappedSpecifiedTask,
          {}
        )
      ) as MappedSpecifiedTask[];
    }

    return (tasks as Page<Task>)?.content?.map((task, taskIndex) => {
      const createdDate = moment(task.created);
      const dueDate = moment(task.due);
      const taskCopy = {...task};

      if (task.due && dueDate.isValid()) taskCopy.due = dueDate.format(MOMENT_FORMAT);
      if (createdDate.isValid()) taskCopy.created = createdDate.format(MOMENT_FORMAT);
      if (canViewTaskPermissions) taskCopy.locked = !canViewTaskPermissions[taskIndex];
      if (canViewCasePermissions) taskCopy.caseLocked = !canViewCasePermissions[taskIndex];

      return taskCopy;
    }) as Task[];
  }
}
