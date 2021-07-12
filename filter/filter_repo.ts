export interface IFilter {
    cacheKey: string;
    filters: IFilterItem[];
}

type FilterType = 'flag' | 'text' | 'id' | 'position';

interface IFilterItem {
    key: string;
    type: FilterType;
    init?: any;
}

const filters: {[key: string]: IFilter} = {

};

module.exports = filters;
