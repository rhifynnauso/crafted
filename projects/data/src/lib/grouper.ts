import {combineLatest, EMPTY, Observable, ReplaySubject} from 'rxjs';
import {map, mergeMap, startWith} from 'rxjs/operators';

export interface GrouperState {
  group: string;
}

export class Group<T> {
  id: string;
  title: string;
  items: T[];
}

export interface GrouperMetadata<T = any, C = any> {
  label: string;
  groupingFunction: (items: T[]) => Group<T>[];
  titleTransform?: (title: string, c: C) => string;
}

export interface GroupLabel {
  id: string;
  label: string;
}

export interface GrouperOptions<T, C> {
  metadata?: Map<string, GrouperMetadata<T, C>>;
  contextProvider?: Observable<C>;
  initialState?: GrouperState;
}

export class Grouper<T = any, C = any> {
  private metadata: Map<string, GrouperMetadata<T, C>>;

  private contextProvider: Observable<C>;

  state = new ReplaySubject<GrouperState>(1);

  constructor(options: GrouperOptions<T, C> = {}) {
    this.metadata = options.metadata || new Map();
    this.contextProvider = options.contextProvider || EMPTY.pipe(startWith(null));

    if (options.initialState) {
      this.state.next(options.initialState);
    } else if (this.metadata.size > 0) {
      this.state.next({group: this.getGroups()[0].id});
    }
  }

  group(): (items: Observable<T[]>) => Observable<Group<T>[]> {
    let config: GrouperMetadata<T, C>|null;
    return (items: Observable<T[]>) => {
      return combineLatest(items, this.state)
          .pipe(
              map(results => {
                const items = results[0];
                const state = results[1];
                const group = state.group!;

                if (this.metadata.has(group)) {
                  config = this.metadata.get(group) || null;
                }

                if (!config) {
                  throw Error(`Missing config for group ${group}`);
                }

                return config.groupingFunction(items);
              }),
              mergeMap(itemGroups => {
                const titleTransform = config!.titleTransform || ((title: string) => title);
                return this.contextProvider.pipe(map(context => {
                  itemGroups.forEach(itemGroup => {
                    itemGroup.title = titleTransform(itemGroup.title, context);
                  });
                  return itemGroups;
                }));
              }),
              map(itemGroups => {
                return itemGroups.sort((a, b) => a.title < b.title ? -1 : 1);
              }));
    };
  }

  getGroups(): GroupLabel[] {
    const groups: GroupLabel[] = [];
    this.metadata.forEach((value, key) => groups.push({id: key, label: value.label}));
    return groups;
  }

  setState(state: GrouperState) {
    this.state.next({...state});
  }

  isEquivalent(otherState?: GrouperState): Observable<boolean> {
    return this.state.pipe(map(state => {
      if (!otherState) {
        return false;
      }

      return state.group === otherState.group;
    }));
  }
}

/** Utility function that creates a group based on the value of the item's property. */
export function getGroupByValue<T>(items: T[], property: string): Group<T>[] {
  const map: Map<string, T[]> = new Map();

  items.forEach((item: any) => {
    const value = item[property];
    if (!map.has(value)) {
      map.set(value, []);
    }

    map.get(value)!.push(item);
  });

  return getGroupsFromMap(map);
}

/** Utility function that creates a group based on the list of values of the item's property. */
export function getGroupByListValues<T>(items: T[], key: string): Group<T>[] {
  const map: Map<string, T[]> = new Map();
  items.forEach((item: any) => {
    let values: any[] = item[key];
    if (!values || !values.length) {
      values = [null];
    }
    values.forEach((value: any) => {
      if (!map.get(value)) {
        map.set(value, []);
      }
      map.get(value)!.push(item);
    });
  });

  return getGroupsFromMap(map);
}

/** Utility function that transforms a map of groups into a list. */
export function getGroupsFromMap<T>(groupsMap: Map<string, T[]>): Group<T>[] {
  const groups: Group<T>[] = [];
  groupsMap.forEach((items, title) => {
    title = `${title}`;  // TItle should always be a string, even if the ID is something else.
    groups.push({id: title, title, items});
  });

  return groups;
}
