import {DragDropModule} from '@angular/cdk/drag-drop';
import {PortalModule} from '@angular/cdk/portal';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {MatButtonModule} from '@angular/material';
import {RouterModule, Routes} from '@angular/router';
import {ItemsListModule} from '@crafted/components';
import {
  ItemDetailDialogModule
} from '../shared/dialog/item-detail-dialog/item-detail-dialog.module';
import {QueryDialogModule} from '../shared/dialog/query/query-dialog.module';
import {ItemDetailModule} from '../shared/item-detail/item-detail.module';
import {QueryMenuModule} from '../shared/query-menu/query-menu.module';
import {QueryPage} from './query-page';


const routes: Routes = [{
  path: '',
  component: QueryPage,
}];

@NgModule({imports: [RouterModule.forChild(routes)], exports: [RouterModule]})
export class QueryPageRoutingModule {
}

@NgModule({
  imports: [
    CommonModule,
    QueryPageRoutingModule,
    MatButtonModule,
    DragDropModule,
    PortalModule,
    ItemDetailModule,
    ItemsListModule,
    ItemDetailDialogModule,
    QueryMenuModule,
    QueryDialogModule,
  ],
  declarations: [QueryPage],
  exports: [QueryPage],
})
export class QueryPageModule {
}
