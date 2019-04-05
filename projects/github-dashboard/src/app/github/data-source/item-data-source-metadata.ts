import {Observable} from 'rxjs';
import {DataSource, DataSourceMetadata} from '../../package/data-source/data-source';
import {Item} from '../app-types/item';

export function getDataSourceProvider(data: Observable<Item[]>) {
  return () => {
    return new DataSource(GithubItemDataMetadata, data);
  };
}

const GithubItemDataMetadata = new Map<string, DataSourceMetadata<Item>>([
  [
    'opened', {
      id: 'opened',
      label: 'Date Opened',
      type: 'date',
      accessor: (item: Item) => item.created,
    }
  ],
  [
    'closed', {
      id: 'closed',
      label: 'Date Closed',
      type: 'date',
      accessor: (item: Item) => item.closed,
    }
  ],
]);
