/*
 * Copyright 2015-2020 Ritense BV, the Netherlands.
 *
 * Licensed under EUPL, Version 1.2 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.See the License for the specific language governing permissions and limitations under the License.
 */

import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators';
import {PluginDefinition, PluginModal} from '../models';

@Injectable({
  providedIn: 'root',
})
export class PluginManagementStateService {
  private readonly _showModal$ = new Subject<PluginModal>();
  private readonly _hideModal$ = new Subject();
  private readonly _inputDisabled$ = new BehaviorSubject<boolean>(false);
  private readonly _saveButtonDisabled$ = new BehaviorSubject<boolean>(true);
  private readonly _refresh$ = new BehaviorSubject<null>(null);
  private readonly _save$ = new Subject();
  private readonly _delete$ = new Subject();
  private readonly _hideModalSaveButton$ = new BehaviorSubject<boolean>(false);
  private readonly _pluginDefinitions$ = new BehaviorSubject<Array<PluginDefinition> | undefined>(
    undefined
  );
  private readonly _selectedPluginDefinition$ = new BehaviorSubject<PluginDefinition | undefined>(
    undefined
  );

  get showModal$(): Observable<PluginModal> {
    return this._showModal$.asObservable();
  }

  get hideModal$(): Observable<any> {
    return this._hideModal$.asObservable();
  }

  get inputDisabled$(): Observable<boolean> {
    return this._inputDisabled$.asObservable();
  }

  get refresh$(): Observable<any> {
    return this._refresh$.asObservable();
  }

  get pluginDefinitions$(): Observable<Array<PluginDefinition> | undefined> {
    return this._pluginDefinitions$.asObservable();
  }

  get selectedPluginDefinition$(): Observable<PluginDefinition | undefined> {
    return this._selectedPluginDefinition$.asObservable();
  }

  get saveButtonDisabled$(): Observable<boolean> {
    return this._saveButtonDisabled$.asObservable();
  }

  get save$(): Observable<any> {
    return this._save$.asObservable();
  }

  get delete$(): Observable<any> {
    return this._delete$.asObservable();
  }

  get hideModalSaveButton$(): Observable<boolean> {
    return this._hideModalSaveButton$.asObservable();
  }

  showModal(modalType: PluginModal): void {
    this._showModal$.next(modalType);
  }

  hideModal(): void {
    this._hideModal$.next();
  }

  disableInput(): void {
    this._inputDisabled$.next(true);
  }

  enableInput(): void {
    this._inputDisabled$.next(false);
  }

  refresh(): void {
    this._refresh$.next(null);
  }

  setPluginDefinitions(definitions: Array<PluginDefinition>): void {
    this._pluginDefinitions$.next(definitions);
  }

  selectPluginDefinition(definition: PluginDefinition): void {
    this._selectedPluginDefinition$.next(definition);
  }

  clearSelectedPluginDefinition(): void {
    this._selectedPluginDefinition$.next(undefined);
  }

  enableSaveButton(): void {
    this._saveButtonDisabled$.next(false);
  }

  disableSaveButton(): void {
    this._saveButtonDisabled$.next(true);
  }

  save(): void {
    this._saveButtonDisabled$.pipe(take(1)).subscribe(saveButtonDisabled => {
      if (!saveButtonDisabled) {
        this._save$.next();
      }
    });
  }

  delete(): void {
    this._delete$.next();
  }

  hideModalSaveButton(): void {
    this._hideModalSaveButton$.next(true);
  }

  showModalSaveButton(): void {
    this._hideModalSaveButton$.next(false);
  }

  clear(): void {
    this._selectedPluginDefinition$.next(undefined);
  }
}