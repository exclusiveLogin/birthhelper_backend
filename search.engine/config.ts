import {Observable, of} from "rxjs";

export interface SearchConfig {
    [section: string]: SearchSectionConfig;
}

export interface SearchSectionConfig {
    title: string;
    type: SearchFilterType;
    fetcher$: Observable<SearchFilter[]>
}

export interface SearchSection {
    key: string;
    title: string;
    type: SearchFilterType;
    filters: SearchFilter[];
}

export interface SearchSectionResponse {
    [sections: number]: SearchSection[]
}

export interface SearchFilter {
    id: number;
    title: string;
}

export type SearchFilterType = 'flag' | 'select';

export const sectionClinicConfig: {[k: string]: string[]} = {
    clinic: [
        'clinic_type_birth_section',
        'clinic_personal_birth_section',
        'clinic_placement_birth_section',
        'clinic_facilities_birth_section',
    ]
};

export const searchConfig: SearchConfig = {
    clinic_type_birth_section: {
        type: "flag",
        title: 'Как рожать',
        fetcher$: of([]),
    },
    clinic_personal_birth_section: {
        type: "flag",
        title: 'С кем рожать',
        fetcher$: of([]),
    },
    clinic_placement_birth_section: {
        type: "select",
        title: 'Палата',
        fetcher$: of([]),
    },
    clinic_facilities_birth_section: {
        type: "flag",
        title: 'Удобства',
        fetcher$: of([]),
    }
};
