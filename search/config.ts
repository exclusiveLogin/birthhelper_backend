import {Observable, of} from "rxjs";
import {DictionaryEngine, DictionaryItem} from "../dictionary/dictionary_engine";
import {CacheEngine} from "../cache.engine/cache_engine";
import {filter, map, switchMap} from "rxjs/operators";
import {AuthorizationEngine} from "../auth/auth.engine";
import {DataBaseService} from "../db/sql";
import {EntityEngine} from "../entity/entity_engine";
import {ContainerEngine} from "../container/container_engine";
import {SlotEngine} from "../slot/slot_engine";
import { ConfigEngine } from "../config/config_engine";
import { OrderEngine } from "../orders/orders_engine";
import {SearchEngine} from "../search/engine";
import {FeedbackEngine} from "../feedback/feedback_engine";
import {LikeEngine} from "../like/like_engine";
import {CommentEngine} from "../comment/comment_engine";
import {TagEngine} from "../tag/tag_engine";

export type SearchConfig = {
    [section in SectionKeys]: { [key in typeof sectionConfig[section][number]]?: SearchSectionConfig};
}

export type SearchConfigResponse<T extends SectionKeys> = {
    [key in typeof sectionConfig[T][number]]?: { [key: string]: any };
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

export interface SearchFilter {
    id: number;
    title: string;
}

export type SearchFilterType = 'flag' | 'select';

export type SectionKeys = keyof typeof sectionConfig;

export const sectionConfig = {
    clinic: [
        'clinic_type_birth_section',
        'clinic_personal_birth_section',
        'clinic_placement_birth_section',
        'clinic_facilities_birth_section',
    ],
    consultation: [
        'consultation_patology',
        'consultation_services',
    ],
} as const;

export const ConsultationPropertyMap = [
    'avo',
    'anemy',
    'anomaly_evolution',
    'gestos',
    'hypoxy',
    'mioms',
    'onko',
    'home_visit'
];

export interface Context {
    dictionaryEngine: DictionaryEngine;
    searchEngine: SearchEngine;
    cacheEngine: CacheEngine;
    authorizationEngine: AuthorizationEngine;
    dbe: DataBaseService;
    entityEngine: EntityEngine;
    entityEngineAdmin: EntityEngine;
    containerEngine: ContainerEngine;
    slotEngine: SlotEngine;
    configEngine: ConfigEngine;
    orderEngine: OrderEngine;
    feedbackEngine: FeedbackEngine;
    likeEngine: LikeEngine;
    commentEngine: CommentEngine;
    tagEngine: TagEngine;
}
export const getSearchConfig = (context: Context): SearchConfig => {
    const searchConfig: SearchConfig = {
        clinic: {
            clinic_type_birth_section: {
                type: "flag",
                title: 'Как рожать',
                fetcher$: of(null).pipe(switchMap(() => context.dictionaryEngine.getDict('dict_birthtype')))
                    .pipe(
                        filter(data => !!data),
                        map((dictItems: DictionaryItem[]) => (dictItems.map(item => ({id: item.id, title: item.title}))))
                    ),
            },
            clinic_personal_birth_section: {
                type: "flag",
                title: 'С кем рожать',
                fetcher$: of(null).pipe(switchMap(() => context.dictionaryEngine.getDict('dict_doctor_position_type')))
                    .pipe(
                        filter(data => !!data),
                        map((dictItems: DictionaryItem[]) => (dictItems.map(item => ({id: item.id, title: item.title}))))
                    ),
            },
            clinic_placement_birth_section: {
                type: "select",
                title: 'Палата',
                fetcher$: of(null).pipe(switchMap(() => context.dictionaryEngine.getDict('dict_placement')))
                    .pipe(
                        filter(data => !!data),
                        map((dictItems: DictionaryItem[]) => (dictItems.map(item => ({id: item.id, title: item.title}))))
                    ),
            },
            clinic_facilities_birth_section: {
                type: "flag",
                title: 'Удобства',
                fetcher$: of(null).pipe(switchMap(() => context.dictionaryEngine.getDict('dict_facilities_type')))
                    .pipe(
                        filter(data => !!data),
                        map((dictItems: DictionaryItem[]) => (dictItems.map(item => ({id: item.id, title: item.title}))))
                    ),
            }
        },
        consultation: {
            consultation_patology: {
                type: "flag",
                title: 'Паталогии',
                fetcher$: of([
                    {id: 0, title: 'АВО статус'},
                    {id: 1, title: 'Различные анемии'},
                    {id: 2, title: 'Аномалии развития'},
                    {id: 3, title: 'Гестозы'},
                    {id: 4, title: 'Гипоксия'},
                    {id: 5, title: 'Миомы'},
                    {id: 6, title: 'Онкопатологии'},
                    {id: 7, title: 'Вызов на дом'},
                ])
            },
            consultation_services: {
                type: "flag",
                title: 'Оказываемые услуги',
                fetcher$: of([
                    {id: 5, title: 'Ведение ЭКО беременности'},
                    {id: 6, title: 'Ведение многоплодной беременности'},
                    {id: 7, title: 'Онлайн консультации'},
                ]),
            }
        }

    };

    return searchConfig;
}
