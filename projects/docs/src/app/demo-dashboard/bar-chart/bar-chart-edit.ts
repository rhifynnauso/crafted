import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {WIDGET_DATA, WidgetData, WidgetEditor} from '@crafted/components';
import {DataSource, Filterer, Grouper} from '@crafted/data';
import {Subject} from 'rxjs';

import {BarChartOptions, BarChartWidgetDataConfig} from './bar-chart';


@Component({
  templateUrl: 'bar-chart-edit.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartEdit implements WidgetEditor {
  dataOptions: {id: string, label: string}[] = [];

  grouper: Grouper<any, any>;
  filterer: Filterer<any, any>;
  dataSource: DataSource<any>;

  form = new FormGroup({
    dataSourceType: new FormControl(null),
    grouperState: new FormControl(null),
    filteredGroups: new FormControl(null),
    filtererState: new FormControl(null),
  });

  destroyed = new Subject();

  constructor(@Inject(WIDGET_DATA) public data:
                WidgetData<BarChartOptions, BarChartWidgetDataConfig>) {
    this.data.config.dataResourcesMap.forEach(
      dataSource => this.dataOptions.push({id: dataSource.id, label: dataSource.label}));
    const initialDataSourceType = this.dataOptions[0].id;
    this.form.get('dataSourceType').setValue(initialDataSourceType);

    const dataSourceProvider = data.config.dataResourcesMap.get(initialDataSourceType);
    this.grouper = dataSourceProvider.grouper();
    this.filterer = dataSourceProvider.filterer();
    this.dataSource = dataSourceProvider.dataSource();

    const value = data.options;
    if (value) {
      if (value.dataSourceType) {
        this.form.get('dataSourceType').setValue(value.dataSourceType);
      }
      if (value.grouperState) {
        this.form.get('grouperState').setValue(value.grouperState);
      }
      if (value.filteredGroups) {
        this.form.get('filteredGroups').setValue(value.filteredGroups);
      }
      if (value.filtererState) {
        this.form.get('filtererState').setValue(value.filtererState);
      }
    }
  }

  get options() {
    return this.form.value;
  }
}
