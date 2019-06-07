import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Dashboard} from '@crafted/components';
import {Store} from '@ngrx/store';
import {combineLatest, Observable, of, Subject} from 'rxjs';
import {map, mergeMap, take, tap} from 'rxjs/operators';
import {Config, RepoConfig} from '../../service/config';
import {AppState} from '../../store';
import {SyncDashboards} from '../../store/dashboard/dashboard.action';
import {Query} from '../model/query';
import {Recommendation} from '../model/recommendation';
import {ConfirmConfigUpdates} from '../shared/dialog/confirm-config-updates/confirm-config-updates';
import {compareLocalToRemote, IdentifiedObject, LocalToRemoteComparison} from '../utility/list-dao';
import {RepoState} from './active-store';

@Injectable()
export class RepoGist {
  private destroyed = new Subject();

  constructor(private config: Config, private dialog: MatDialog, private store: Store<AppState>) {}

  sync(repository: string, repoState: RepoState): Observable<void> {
    let syncResults: LocalToRemoteComparison<IdentifiedObject>[]|null;
    return this.config.getRepoConfig(repository)
        .pipe(
            mergeMap(repoConfig => getSyncResults(repoState, repoConfig, this.store)),
            tap(results => syncResults = results), mergeMap(results => this.confirmSync(results)),
            map(confirmed => {
              if (!confirmed) {
                // TODO: Perhaps update the modified date on the update items to make sure
                // the local versions now have a later modified date for next time the comparison
                // is made.
                return;
              }

              const dashboardsSync = syncResults[0] as LocalToRemoteComparison<Dashboard>;
              const add = dashboardsSync.toAdd.map(d => ({id: d.id, changes: {...d}}));
              const update = dashboardsSync.toUpdate.map(d => ({id: d.id, changes: {...d}}));
              this.store.dispatch(new SyncDashboards(
                  {update: update.concat(add), remove: dashboardsSync.toRemove.map(d => d.id)}));

              const querySync = syncResults[1] as LocalToRemoteComparison<Query>;
              repoState.queriesDao.add(querySync.toAdd);
              repoState.queriesDao.update(querySync.toUpdate);
              repoState.queriesDao.remove(querySync.toRemove.map(v => v.id));

              const recommendationsSync = syncResults[2] as LocalToRemoteComparison<Recommendation>;
              repoState.recommendationsDao.add(recommendationsSync.toAdd);
              repoState.recommendationsDao.update(recommendationsSync.toUpdate);
              repoState.recommendationsDao.remove(recommendationsSync.toRemove.map(v => v.id));
            }));
  }

  private confirmSync(syncResults: LocalToRemoteComparison<any>[]|null): Observable<boolean> {
    if (!syncResults || syncResults.every(result => !hasSyncChanges(result))) {
      return of(false);
    }

    const data = {
      dashboards: syncResults[0],
      queries: syncResults[1],
      recommendations: syncResults[2],
    };
    return this.dialog.open(ConfirmConfigUpdates, {width: '400px', data})
        .afterClosed()
        .pipe(take(1));
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
}

function hasSyncChanges(syncResponse: LocalToRemoteComparison<any>): boolean {
  return syncResponse &&
      (!!syncResponse.toAdd.length || !!syncResponse.toRemove.length ||
       !!syncResponse.toUpdate.length);
}

/** Gets the comparison results between the local store and remote config */
function getSyncResults(
    repoState: RepoState, remoteConfig: RepoConfig|null,
    store: Store<AppState>): Observable<LocalToRemoteComparison<any>[]|null> {
  if (!remoteConfig) {
    return of(null);
  }

  return combineLatest(
             store.select(state => state.dashboards.ids.map(id => state.dashboards.entities[id])),
             repoState.queriesDao.list, repoState.recommendationsDao.list)
      .pipe(
          map(([dashboards, queries, recommendations]) =>
                  [compareLocalToRemote(dashboards, remoteConfig.dashboards),
                   compareLocalToRemote(queries, remoteConfig.queries),
                   compareLocalToRemote(recommendations, remoteConfig.recommendations)]),
          take(1));
}
