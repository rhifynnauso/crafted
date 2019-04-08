import {combineLatest, Observable, of, ReplaySubject} from 'rxjs';
import {map, take} from 'rxjs/operators';

export interface ViewerState {
  views: string[];
}

interface RenderedViewWithText {
  text: string;
  classList?: string;
  styles?: {[key in string]: string};
}

interface RenderedViewWithChildren {
  children: RenderedView[];
  classList?: string;
  styles?: {[key in string]: string};
}

export type RenderedView = RenderedViewWithText|RenderedViewWithChildren;

export interface ViewerMetadata<C = any> {
  label: string;
  render: (item: any, context: C) => RenderedView | null;
}

export interface ViewLabel {
  id: string;
  label: string;
}

export type ViewerContextProvider<T, C> = Observable<(item: T) => C>;

/** The viewer carries information to render the items to the view. */
export class Viewer<T = any, C = any> {
  state = new ReplaySubject<ViewerState>(1);

  constructor(
      public metadata: Map<string, ViewerMetadata<C>>,
      private contextProvider?: ViewerContextProvider<T, C>) {}

  getViews(): ViewLabel[] {
    const views: ViewLabel[] = [];
    this.metadata.forEach((value, view) => views.push({id: view, label: value.label}));
    return views;
  }

  toggle(view: string) {
    this.state.pipe(take(1)).subscribe(state => {
      const views = state.views;

      const newViews = [...views];
      const index = views.indexOf(view);
      if (index !== -1) {
        newViews.splice(index, 1);
      } else {
        newViews.push(view);
      }

      this.setState({views: newViews});
    });
  }

  setState(state: ViewerState) {
    this.state.next({...state});
  }

  isEquivalent(otherState?: ViewerState): Observable<boolean> {
    return this.state.pipe(map(state => {
      if (!otherState) {
        return false;
      }
      const thisViews = state.views.slice().sort();
      const otherViews = otherState.views.slice().sort();

      return thisViews.length === otherViews.length &&
          thisViews.every((v, i) => otherViews[i] === v);
    }));
  }

  getRenderedViews(item: T): Observable<RenderedView[]> {
    const contextProvider = this.contextProvider || of(() => null);
    return combineLatest(this.state, contextProvider).pipe(map(results => {
      const views = results[0].views.map(v => this.metadata.get(v)!);
      const context = results[1](item);
      return views.map(view => view.render(item, context));
    }));
  }
}
