import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {DataSource, Filterer, Sorter, Viewer} from '@crafted/data';
import {Observable} from 'rxjs';

import {WIDGET_DATA, WidgetData, WidgetEditor} from '../../dashboard/dashboard';
import {SavedFiltererState} from '../../form/filter-state-option/filter-state-option';

import {ListOptions, ListWidgetDataConfig} from './list';


@Component({
  templateUrl: 'list-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListEditor implements WidgetEditor {
  dataOptions: {id: string, label: string}[] = [];

  viewer: Viewer;
  sorter: Sorter;
  filterer: Filterer;
  dataSource: DataSource;

  form = new FormGroup({
    dataType: new FormControl(null),
    listLength: new FormControl(5),
    sorterState: new FormControl(null),
    viewerState: new FormControl(null),
    filtererState: new FormControl(null),
  });

  savedFiltererStates: Observable<SavedFiltererState[]>;

  get options(): ListOptions {
    return this.form.value;
  }

  constructor(@Inject(WIDGET_DATA) public data: WidgetData<ListOptions, ListWidgetDataConfig>) {
    // TODO: Filter based on data type
    this.savedFiltererStates = data.config.savedFiltererStates;
    this.data.config.dataResourcesMap.forEach(
      d => this.dataOptions.push({id: d.type, label: d.label}));

    const dataType = this.dataOptions[0].id;
    this.form.get('dataType').setValue(dataType);

    const dataSourceProvider = data.config.dataResourcesMap.get(dataType);
    this.sorter = dataSourceProvider.sorter();
    this.viewer = dataSourceProvider.viewer();
    this.filterer = dataSourceProvider.filterer();
    this.dataSource = dataSourceProvider.dataSource();

    const value = data.options;
    if (value) {
      if (value.dataType) {
        this.form.get('dataType').setValue(value.dataType);
      }
      if (value.listLength) {
        this.form.get('listLength').setValue(value.listLength);
      }
      if (value.sorterState) {
        this.form.get('sorterState').setValue(value.sorterState);
      }
      if (value.viewerState) {
        this.form.get('viewerState').setValue(value.sorterState);
      }
      if (value.filtererState) {
        this.form.get('filtererState').setValue(value.filtererState);
      }
    }
  }
}
