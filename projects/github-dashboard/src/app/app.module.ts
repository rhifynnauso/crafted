import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {AngularFireModule} from '@angular/fire';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {MatIconRegistry, MatSnackBarModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PreloadAllModules, RouterModule} from '@angular/router';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import 'hammerjs';
import {TimeAgoPipe} from 'time-ago-pipe';

import {App} from './app';
import {FIREBASE_CONFIG} from './firebase.config';
import {HomePage} from './home-page/home-page';
import {LoginModule} from './home-page/home-page.module';
import {Theme} from './repository/services/theme';
import {LoginDialogModule} from './service/login-dialog/login-dialog.module';
import {RateLimitReachedModule} from './service/rate-limit-reached/rate-limit-reached.module';
import {metaReducers, reducers} from './store';
import {GithubEffects} from './store/github/github.effects';
import {ItemEffects} from './store/item/item.effects';
import {LocalDbEffects} from './store/local-db/local-db.effects';
import {RepositoryEffects} from './store/repository/repository.effects';


@NgModule({
  declarations: [TimeAgoPipe],
  exports: [TimeAgoPipe],
})
export class TimeAgoPipeModule {
}

@NgModule({
  declarations: [App],
  imports: [
    MatSnackBarModule,
    AngularFireModule.initializeApp(FIREBASE_CONFIG),
    AngularFireAuthModule,
    RateLimitReachedModule,
    LoginDialogModule,
    BrowserAnimationsModule,
    LoginModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, {metaReducers}),
    EffectsModule.forRoot([ItemEffects, LocalDbEffects, GithubEffects, RepositoryEffects]),
    RouterModule.forRoot(
        [
          {path: '', component: HomePage},
          {
            path: ':org/:name',
            loadChildren: './repository/repository.module#RepositoryModule',
          },
        ],
        {preloadingStrategy: PreloadAllModules}),
  ],
  providers: [MatIconRegistry, Theme],
  bootstrap: [App]
})
export class AppModule {
}
