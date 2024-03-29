/* eslint-disable no-case-declarations */
import validator from "validator";
import { Router } from "express";
import fs from "fs";
import multer from "multer";
import { CacheEngine } from "../cache.engine/cache_engine";
import { entityRepo } from "./entity_repo";
import {
  Entity as EntityConfig,
  EntityKeys,
  EntityRepo,
} from "./entity_repo.model";
import { SearchEngine, Summary } from "../search/engine";
import { Context, SectionKeys } from "../search/config";
import {
  combineLatest,
  forkJoin,
  from,
  Observable,
  of,
  throwError,
} from "rxjs";
import { map, mapTo, switchMap, take, tap } from "rxjs/operators";
import {
  concatFn,
  generateQStr,
  getFiltersByRequest,
  getIdByRequest,
  restrictGenerator,
} from "../db/sql.helper";
import { EntityCalc, EntityField } from "../entity/entity_repo.model";
import { cacheKeyGenerator } from "../search/sections.handler";
import { containers } from "../container/container_repo";
import { Slot, slots } from "../slot/slot_repo";
import { dictionaries } from "../dictionary/dictionary_repo";
import { ContainerRecordSrc } from "../container/container_engine";
import { hideFields } from "./utils";
import * as express from "express";
import path from "path";
import bodyParser from "body-parser";

const folders = [
  "./uploads/system-images",
  "./uploads/user-images",
  "./uploads/files",
];

folders.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const jsonparser = bodyParser.json();

import EasyYandexS3 from "easy-yandex-s3";

const s3 = new EasyYandexS3({
  auth: {
    accessKeyId: "2394_1iRfVPqBmWb254J",
    secretAccessKey: "qKhk-DlvydnO4pccwir_iJgHi1SGcuBzM-AERsYL",
  },
  Bucket: "birhhelper-storage", // Название бакета
  debug: true, // Дебаг в консоли
});

const entities = entityRepo;
const sanitizer = validator.escape;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const meta = req.body && JSON.parse(req?.body?.meta ?? {});
    // console.log('META: ', meta);
    const { folder = "/" } = meta;
    cb(null, `uploads${folder}`);
  },
  filename: function (req, file, cb) {
    const originalname = file.originalname.split(".");
    const newName = originalname[0] + "_" + Date.now() + "." + originalname[1];
    cb(null, newName);
  },
});

const fileFilter = (req, file, cb) =>
  file && file.mimetype === "image/jpeg" ? cb(null, true) : cb(null, false);

const upload = multer({ storage: storage, fileFilter });
const entity = express.Router();

export interface Entity extends Slotted {
  [key: string]: any;

  ["id"]: number;
  ["summary"]?: Summary;
}

export interface Slotted {
  _contragent?: Entity;
  _entity?: Entity;
}

interface FKEntity {
  key: string;
  value: Entity[];
  id: number;
}

interface CalcEntity {
  key: string;
  value: any;
  id: number;
}

export interface FilterParams {
  [key: string]: string;
  skip?: string;
  limit?: string;
}

export class EntityEngine {
  cacheEngine: CacheEngine;
  searchEngine: SearchEngine;

  constructor(private context: Context, admin?: boolean) {
    if (admin) {
      context.entityEngineAdmin = this;
    } else {
      context.entityEngine = this;
    }

    this.searchEngine = context.searchEngine;
    this.cacheEngine = context.cacheEngine;
  }

  getEntitiesConfig(): EntityRepo {
    return entities;
  }

  getEntityParams(name: string): EntityConfig {
    return entities[name];
  }

  hasEntity(name: string): boolean {
    return !!entities[name];
  }

  getSetFromDB(key: EntityKeys, filters: FilterParams): Observable<number> {
    const db = entities[key].db_name;
    const slotKey = entities[key].slot;
    const slotConfig = slots[slotKey];
    const isContragent = entities[key].isContragent;

    if (!!key && !!db) {
      if (slotConfig?.restrictsOfSlot) {
        filters = restrictGenerator(slotConfig.restrictsOfSlot, filters);
      }
      const likeStr = [
        ...generateQStr(key, filters, "string"),
        ...generateQStr(key, filters, "flag"),
        ...(isContragent
          ? [
              ...generateQStr("ent_contragents", filters, "string"),
              ...generateQStr("ent_contragents", filters, "flag"),
            ]
          : []),
      ].join(" AND ");
      const whereStr = [
        ...generateQStr(key, filters, "id"),
        ...(isContragent
          ? [...generateQStr("ent_contragents", filters, "id")]
          : []),
      ].join(" AND ");

      let q = `SELECT COUNT(*) as cnt 
                     FROM \`${db}\`
                     ${whereStr ? "WHERE " + whereStr : ""} 
                     ${
                       likeStr ? (whereStr ? " AND " : " WHERE ") + likeStr : ""
                     } `;

      if (isContragent) {
        q = `SELECT COUNT(*) as cnt 
                     FROM \`${db}\` JOIN \`contragents\` 
                     ON \`${db}\`.\`contragent\` = \`contragents\`.\`id\` 
                     ${whereStr ? "WHERE " + whereStr : ""} 
                     ${
                       likeStr ? (whereStr ? " AND " : " WHERE ") + likeStr : ""
                     }`;
      }

      return this.context.dbe.queryList<Entity>(q).pipe(
        // tap(data => console.log('getSetFromDB result:', data)),
        map((result) => (result?.[0]?.cnt as number) ?? 0)
      );
    }

    console.error("что то пошло не так... Сущность сета не определена");
    return throwError("Сущность сета не определена");
  }

  entitySetHandler(req, res): void {
    const key = getIdByRequest(req) as EntityKeys;
    const filters = getFiltersByRequest(req);
    if (key) {
      const hash = req.query.hash;
      const searchKey: SectionKeys = entities[req.params.id].searchKey;
      const container = entities[req.params.id].container || null;
      const slot = entities[req.params.id].slot || null;

      const ids$ = this.searchEngine
        .getEntitiesIDByHash(searchKey, hash)
        ?.pipe(map((result) => result.length || 0));
      const provider = hash && ids$ ? ids$ : this.getSetFromDB(key, filters);

      provider.pipe(take(1)).subscribe(
        (result) =>
          res.send({
            total: result,
            fields: entities[req.params.id].fields || [],
            container: container ? containers[container] : null,
            slot: slot ? slots[slot] : null,
            links: entities[req.params.id].links || [],
          }),
        () => {
          res.send([]);
        }
      );
    }
  }

  entityFilterHandler(req, res): void {
    if (!!entities[req.params.id] && !!entities[req.params.id].filters) {
      res.send(JSON.stringify(entities[req.params.id].filters));
    } else {
      res.send([]);
    }
  }

  rootHandler(req, res) {
    res.set("Content-Type", "text/html");
    res.write("Эндпоинт для сущностей доступны следующие: <br>");
    Object.keys(entities).forEach((key) => res.write(key + "<br>"));

    res.write("<p> Формат запроса GET /entity/{key} </p> <br>");
    res.write(
      "<p> ex: GET http://birthhelper.ru/admin/entity/ent_services </p> <br>"
    );
    res.end();
  }

  garbageHandler(keys: string[], sections: SectionKeys[]): void {
    keys.forEach((k) => this.cacheEngine.softClearByKey(k));
    sections.forEach((k) => this.searchEngine.resetSearchStoreBySection(k));
    sections.forEach((k) => this.searchEngine.resetSummaryStoreBySection(k));
  }

  async createEntity(name: string, data: unknown) {
    if (!data)
      return Promise.reject("Нет данных для создания или изменеиня сущности");
    const config = this.getEntityParams(name);
    if (!config)
      return Promise.reject("Нет конфигурации для сущности: " + name);

    const db = config.db_name;
    const reqKeys = config.fields.filter((f) => !!f.required);
    const fields = config.fields;
    const calc = config.calculated;
    const isSlot = !!config.slot;
    if (isSlot) data["entity_key"] = name;
    //убираем пересечения
    calc && calc.forEach((c) => delete data[c.key]);

    if (!reqKeys.every((r) => !!data[r.key])) {
      return Promise.reject("не полные данные в запросе");
    }

    if (
      !Object.keys(data).every(
        (r) => !!fields.find((f) => f.key === r || r === "entity_key")
      )
    ) {
      return Promise.reject("в запросе присутствут неизвестные поля");
    }

    const valArr = Object.keys(data).map((datakey) => {
      if (isSlot && datakey === "entity_key") return `"${sanitizer(name)}"`;
      const targetReq = fields.find((r) => r.key === datakey);
      if (targetReq.type === "id") {
        data[datakey] = data[datakey] !== null && +data[datakey];
      }
      if (!targetReq) return;
      return targetReq.type === "string" || targetReq.type === "text"
        ? `"${sanitizer(data[datakey].toString())}"`
        : data[datakey];
    });

    const existArr = concatFn(Object.keys(data), valArr);
    //console.log('existArr: ', existArr);

    const q = `INSERT INTO \`${db}\` (\`${Object.keys(data).join(
      "`, `"
    )}\`) VALUES ( ${valArr
      .map((value) => (value === null ? "null" : value))
      .join(",")} )`;
    const qi = existArr.join(", ");
    const qf = q + " ON DUPLICATE KEY UPDATE " + qi;

    const createSections = config.createAffectionSectionKeys ?? [];

    return this.context.dbe
      .queryList(qf)
      .pipe(
        mapTo("Данные обновлены"),
        tap(() =>
          this.garbageHandler(
            [
              config.db_name,
              ...name
                .split("_")
                .filter((part) => part !== "ent" && part !== "dict"),
            ],
            createSections
          )
        )
      )
      .toPromise();
  }

  async createEntityHandler(req, res) {
    const data = req.body;
    const name = req.params.id;

    try {
      const result = await this.createEntity(name, data);
      res.send(
        JSON.stringify({
          result,
          data,
        })
      );
    } catch (e) {
      res.status(500);
      res.send({ error: e });
      // console.log(e);
    }
  }

  async deleteEntity(name: string, id: string) {
    const config = this.getEntityParams(name);
    if (!config) return Promise.reject("не удалось определить сущность");
    const db = config.db_name;
    const deleteSections = config.deleteAffectionSectionKeys ?? [];

    const qd = `DELETE FROM \`${db}\` WHERE id=${id}`;

    return this.context.dbe
      .queryList(qd)
      .pipe(
        mapTo(`Запись с id = ${id} удалена`),
        tap(() =>
          this.garbageHandler(
            [
              config.db_name,
              ...name
                .split("_")
                .filter((part) => part === "ent" || part === "dict"),
            ],
            deleteSections
          )
        )
      )
      .toPromise();
  }

  async deleteEntityHandler(req, res) {
    // console.log('delete middle', req.body);
    const id = req?.body?.id;
    const name = req.params.id;

    try {
      const result = await this.deleteEntity(name, id);
      res.send({ result });
    } catch (e) {
      res.status(500);
      res.send({ error: e });
    }
  }

  getEntitiesByIds<T extends Entity>(
    ids: number[],
    key: EntityKeys,
    skip = 0
  ): Observable<T[]> {
    if (!ids?.length) return of([]);
    const config = entities[key];
    const isContragent = config.isContragent;
    const db = config.db_name;
    const cacheKey = cacheKeyGenerator(key, "hash", ids);

    ids = ids.splice(skip, 20);
    const whereStr = ids.length
      ? `${ids.map((id) => "id = " + id).join(" OR ")}`
      : null;

    // default query
    let q = `
            SELECT * 
            FROM \`${db}\` 
            ${whereStr ? "WHERE " + whereStr : ""}`;

    if (isContragent) {
      const whereStr = ids.length
        ? `${ids.map((id) => `\`${db}\`.\`id\` = ${id}`).join(" OR ")}`
        : null;
      q = `
            SELECT *, \`${db}\`.\`id\` as _id 
            FROM \`${db}\` JOIN \`contragents\` 
            ON \`${db}\`.\`contragent\` = \`contragents\`.\`id\` 
            ${whereStr ? "WHERE " + whereStr : ""}`;
    }

    return this.context.dbe
      .getEntitiesFromDB<T>(q, cacheKey)
      .pipe(
        tap((_) =>
          _.forEach(
            ($) => ($.id = ($._id as number) ? ($._id as number) : $.id)
          )
        )
      );
  }

  getEntityPortion<T extends Entity>(
    key: EntityKeys,
    filters?: FilterParams,
    skip = 0,
    limit = 20
  ): Observable<T[]> {
    const config = entities[key];
    const isContragent = config.isContragent;
    const db = config.db_name;
    const slotKey = config.slot;
    const slotConfig = slots[slotKey];

    if (slotConfig?.restrictsOfSlot) {
      filters = restrictGenerator(slotConfig.restrictsOfSlot, filters);
    }

    const likeStr = [
      ...generateQStr(key, filters, "string"),
      ...generateQStr(key, filters, "flag"),
      ...(isContragent
        ? [
            ...generateQStr("ent_contragents", filters, "string"),
            ...generateQStr("ent_contragents", filters, "flag"),
          ]
        : []),
    ].join(" AND ");
    const whereStr = [
      ...generateQStr(key, filters, "id"),
      ...(isContragent
        ? [...generateQStr("ent_contragents", filters, "id")]
        : []),
    ].join(" AND ");
    const limStr = `${
      skip ? " LIMIT " + limit + " OFFSET " + skip : " LIMIT " + limit
    }`;

    // default query
    let q = `
                SELECT * 
                FROM \`${db}\` 
                ${whereStr ? "WHERE " + whereStr : ""} 
                ${likeStr ? (whereStr ? " AND " : " WHERE ") + likeStr : ""} 
                ${limStr}`;

    if (isContragent) {
      q = `
                SELECT *, \`${db}\`.\`id\` as _id 
                FROM \`${db}\` JOIN \`contragents\` 
                ON \`${db}\`.\`contragent\` = \`contragents\`.\`id\` 
                ${whereStr ? "WHERE " + whereStr : ""} 
                ${likeStr ? (whereStr ? " AND " : " WHERE ") + likeStr : ""} 
                ${limStr}`;
    }

    // console.log('getEntityPortion: ', q);

    return this.context.dbe
      .queryList<T>(q)
      .pipe(
        tap((_) =>
          _.forEach(
            ($) => ($.id = ($._id as number) ? ($._id as number) : $.id)
          )
        )
      );
  }

  getEntities<T extends Entity>(
    key: EntityKeys,
    hash: string,
    filters: FilterParams,
    eid: number = null
  ): Observable<T[]> {
    // console.log('getEntities ', key, hash, filters, eid)
    const config = entities[key];

    if (!config) {
      return throwError(`Сущность ${key} не найдена`);
    }

    const searchKey: SectionKeys = config?.searchKey;
    const generateSummary = searchKey && config?.generateSummariesEnabled;
    const skip = Number(filters?.skip ?? "0");
    const limit = Number(filters?.limit ?? "20");
    const fields = JSON.parse(JSON.stringify(config?.fields));
    const hidedFields = config?.hiddenFields;
    const calc = config?.calculated;
    const slotKey = config?.slot;
    const slotConfig = slots[slotKey];
    const masterContragent = key === "ent_contragents";

    // если есть EID это превалирует над всеми остальными источниками. Hash будет проигнорирован
    let provider: Observable<T[]> =
      eid && this.getEntitiesByIds([eid], key, skip);

    // Если есть претендентный hash пробуем получить провадер на ids
    if (hash) {
      const ids$ = this.searchEngine.getEntitiesIDByHash(searchKey, hash);
      provider =
        provider ?? ids$
          ? ids$.pipe(switchMap((_) => this.getEntitiesByIds<T>(_, key, skip)))
          : null;
      // если после попытки у нас провайдер пустой возвращаем ответ внешнему коду
      if (!provider) return null;
    }

    provider = provider ?? this.getEntityPortion<T>(key, filters, skip, limit);

    provider = this.attributeEnricher(provider, key);

    if (config.isContragent && !masterContragent) {
      fields.push(...entities["ent_contragents"].fields);
    }
    // чистим скрытые поля
    if (hidedFields?.length) {
      provider = this.hider(provider, hidedFields);
    }
    // ОБОГОЩАЕМ сущности
    provider = this.metanizer(provider, fields, calc);

    if (masterContragent) {
      provider = this.contragentConcentrator(provider);
    }

    if (generateSummary) {
      provider = this.summarizer<T>(provider, searchKey, hash);
    }

    if (slotConfig) {
      provider = this.slotEnreacher<T>(provider, slotConfig);
    }

    return provider.pipe(
      tap(
        (list) =>
          list.forEach &&
          list.forEach((ent) =>
            Object.keys(ent).forEach(
              (fieldKey) =>
                ((ent as Entity)[fieldKey] =
                  ent[fieldKey] === "null" ? null : ent[fieldKey])
            )
          )
      )
    );
  }

  queryEntityHandler(req, res) {
    // console.log('ent req search: ', req.query, ' url params: ', req.params, this);
    const entKey = getIdByRequest(req) as EntityKeys;
    const filters = getFiltersByRequest(req);

    // console.log('queryEntityHandler filters:', filters);

    if (entKey) {
      const hash = req.query.hash;
      const eid = req.params.eid;

      // console.log('queryEntityHandler hash: ', req.params);

      const provider = this.getEntities(entKey, hash, filters, eid);

      if (!provider) {
        res.status(500);
        res.send({ error: "Hash unknown" });
        return;
      }

      provider.subscribe(
        (data) => {
          res.send(data);
        },
        (error) => {
          console.log("subscribe error", error);
          res.status(500);
          res.send(JSON.stringify({ error }));
        }
      );
    } else {
      res.send([]);
      console.log("сущность не определена");
    }
  }

  contragentConcentrator<T extends Entity>(
    pipeline: Observable<T[]>
  ): Observable<T[]> {
    return pipeline.pipe(
      switchMap((contragents) =>
        contragents?.length
          ? forkJoin(
              contragents.map((ctg) => {
                const dbs: string[] = [];
                // sections
                const hasClinic = !!ctg?.section_clinic;

                // gen sql
                if (hasClinic)
                  dbs.push(entities.ent_clinic_contragents.db_name);

                if (dbs.length) {
                  const q = `SELECT * FROM ${dbs.join(" , ")} WHERE ${dbs
                    .map((db) => `${db}.contragent = ${ctg.id}`)
                    .join(" AND ")}`;
                  return this.context.dbe.query(q).pipe(
                    map((_) => _?.[0] ?? {}),
                    tap((data) =>
                      Object.keys(data).forEach(
                        (k) => ((ctg as Entity)[k] = ctg[k] ?? data[k])
                      )
                    ),
                    map((_) => ctg)
                  );
                } else {
                  return of(ctg);
                }
              })
            ).pipe(map((_) => contragents))
          : of(contragents ?? [])
      )
    );
  }

  summarizer<T extends Entity>(
    pipeline: Observable<T[]>,
    sectionKey: SectionKeys,
    hash: string
  ): Observable<T[]> {
    return pipeline.pipe(
      switchMap((entities) =>
        combineLatest([
          of(entities),
          this.context.searchEngine.getSummary(sectionKey, hash),
        ])
      ),
      map(([entities, summaries]) =>
        entities.map((ent) => ({
          ...ent,
          summary: summaries.find((_) => _.id === ent.contragent) ?? null,
        }))
      )
    );
  }

  slotEnreacher<T extends Entity>(
    pipeline: Observable<T[]>,
    config: Slot
  ): Observable<T[]> {
    type slotMode = "entity" | "container";
    const contragentIDKey = config.contragent_id_key;
    const entityIDKey = config.entity_id_key;
    const entityKey = config.entity_key;
    const contragentEntity = "ent_contragents";
    const containerName = config.container_name;
    const section = config.section;

    return pipeline.pipe(
      switchMap((entities) => {
        const contragentProviders = entities.map((ent) => {
          const contragentID = ent?.[contragentIDKey];
          // console.log('contragentProviders', ent, contragentID);
          return contragentID
            ? this.getEntities(
                contragentEntity,
                null,
                null,
                contragentID as number
              ).pipe(map((data) => data[0]))
            : null;
        });

        const entitiesProviders: Observable<Entity>[] = entities.map((ent) => {
          const mode: slotMode = ent.entity_type === 1 ? "entity" : "container";
          const entityID = ent?.[entityIDKey];
          return mode === "entity" && entityID && entityKey
            ? this.getEntities(entityKey, null, null, entityID as number).pipe(
                map((_) => _?.[0])
              )
            : null;
        });

        const containersProviders: Observable<ContainerRecordSrc>[] =
          entities.map((ent) => {
            const mode: slotMode =
              ent.entity_type === 1 ? "entity" : "container";

            const entityID = ent?.[entityIDKey];

            return mode === "container" && containerName && entityID
              ? from(
                  this.context.containerEngine.getContainers(
                    containers[containerName],
                    entityID as number
                  )
                ).pipe(map((list) => list[0]))
              : null;
          });

        // console.log('containersProviders', containersProviders);

        return forkJoin([
          of(entities),
          contragentProviders.filter((p) => !!p).length
            ? forkJoin(contragentProviders.filter((p) => !!p))
            : of(null as Entity[]),
          entitiesProviders.filter((p) => !!p).length
            ? forkJoin(entitiesProviders.filter((p) => !!p))
            : of(null as Entity[][]),
          containersProviders.filter((p) => !!p).length
            ? forkJoin(containersProviders.filter((p) => !!p))
            : of(null as ContainerRecordSrc[]),
        ]).pipe(
          map(([ents, contragents, entities, containers]) => {
            // console.log('results containers:', entities, containers);
            return ents.map((ent) => {
              const mode: slotMode =
                ent.entity_type === 1 ? "entity" : "container";
              return {
                ...ent,
                _contragent: contragents
                  .filter((_) => !!_)
                  .find(
                    (_) => _.id.toString() === ent[contragentIDKey]?.toString()
                  ),
                _contragent_entity_key: contragentEntity,
                _contragent_id_key: contragentIDKey,
                _entity_id_key: entityIDKey,
                _section: section,
                _entity:
                  mode === "entity"
                    ? entities
                        .filter((_) => !!_)
                        .find(
                          ($) =>
                            $.id.toString() === ent[entityIDKey]?.toString()
                        )
                    : containers
                        .filter((_) => !!_)
                        .find(
                          ($) =>
                            $.id?.toString() === ent[entityIDKey]?.toString()
                        ),
                _entity_key: entityKey,
              };
            });
          })
        );
      })
    );
  }

  hider<T extends Entity>(
    pipeline: Observable<T[]>,
    hidedFields: string[] = []
  ): Observable<T[]> {
    return pipeline.pipe(
      tap((list) => list.forEach((entity) => hideFields(entity, hidedFields)))
    );
  }

  attributeEnricher<T extends Entity>(
    pipeline: Observable<T[]>,
    entKey: EntityKeys,
  ): Observable<T[]> {
    const config = entities[entKey];
    return pipeline.pipe(
      map((list) => list.map((entity) => ({...entity, isContragent: !!config?.isContragent, entityName: entKey})))
    );
  }

  metanizer<T extends Entity>(
    pipeline: Observable<T[]>,
    fields: EntityField[],
    calc: EntityCalc[]
  ): Observable<T[]> {
    return pipeline.pipe(
      // FK
      switchMap((data: T[]) => {
        // console.log('FK tick', data.length);
        const qs: Observable<FKEntity>[] = [];
        data.forEach((row) => {
          Object.keys(row).forEach((k) => {
            const targetReq = fields.find((r) => r.key === k);
            const value = row[k];

            if (targetReq?.type === "string" || targetReq?.type === "text") {
              (row as Entity)[k] = validator.unescape(`${value}`);
            }

            if (targetReq?.loadEntity && value) {
              if (targetReq?.type === "img") {
                const q = `SELECT \`images\`.*, \`files\`.\`filename\`, \`files\`.\`aws\`, \`files\`.\`folder\`
                                                FROM \`files\` 
                                                INNER JOIN \`images\` 
                                                ON \`images\`.\`file_id\` = \`files\`.\`id\` 
                                                WHERE \`images\`.\`id\` = ${row[k]}`;

                qs.push(
                  this.context.dbe.queryList<T>(q).pipe(
                    map((a_result) => ({
                      key: targetReq.key,
                      value: a_result,
                      id: row.id,
                    }))
                  )
                );
              }

              if (targetReq?.type === "id") {
                const db = targetReq.dctKey
                  ? dictionaries[targetReq.dctKey].db
                  : null;
                if (db) {
                  const q = `SELECT * FROM \`${db}\` WHERE \`id\` = ${row[k]}`;

                  qs.push(
                    this.context.dbe.queryList<T>(q).pipe(
                      map((a_result) => ({
                        key: targetReq.key,
                        value: a_result,
                        id: row.id,
                      }))
                    )
                  );
                }
              }
            }
          });
        });

        // console.log('FK que count', qs.length);
        return qs.length
          ? forkJoin(qs).pipe(
              take(1),
              tap((_data: FKEntity[]) => {
                _data.forEach((d) => {
                  const t_row: T = data.find((r) => r.id === d.id);
                  if (t_row) {
                    (t_row as Entity).meta = t_row.meta
                      ? {
                          ...t_row.meta,
                          [d.key]: d.value ? d.value?.[0] : null,
                        }
                      : { [d.key]: d.value ? d.value?.[0] : null };

                    const targetConfigField = fields.find(
                      (f) => f.key === d.key
                    );
                    if (targetConfigField) {
                      if (targetConfigField.type === "img") {
                        (t_row as Entity).filename =
                          d.value?.[0]?.filename ?? null;
                        (t_row as Entity).aws = d.value?.[0]?.aws ?? null;
                        (t_row as Entity).folder = d.value?.[0]?.folder ?? null;
                      }
                    }
                  }
                });
              }),
              mapTo(data)
            )
          : of(data);
      }),
      // CALC
      switchMap((data: T[]) => {
        if (!calc) return of(data);
        // console.log('CALC tick', data.length);
        const qs: Observable<CalcEntity>[] = [];
        data.forEach((row) => {
          const id = row.id;
          calc.forEach((clc) => {
            switch (clc.type) {
              case "count":
                const aq = `SELECT * FROM \`${clc.db_name}\` WHERE \`${clc.id_key}\`='${id}'`;
                qs.push(
                  this.context.dbe.queryList(aq).pipe(
                    map((a_result) => ({
                      key: clc.key,
                      value: a_result.length,
                      id,
                    }))
                  )
                );
                break;
              case "test":
                qs.push(of({ key: clc.key, value: "test", id }));
                break;
              default:
            }
          });
        });

        // console.log('CALC que count', qs.length);

        return qs.length
          ? forkJoin(qs).pipe(
              take(1),
              tap((_data) => {
                _data.forEach((d) => {
                  const target = data.find((t) => t.id === d.id);
                  if (target) Object.assign(target, { [d.key]: d.value });
                });
              }),
              mapTo(data)
            )
          : of(data);
      })
    );
  }

  checkUploadsFSHandler(req, res, next) {
    if (!fs.existsSync("uploads")) {
      console.log("folder upload not exist, creating...");
      fs.mkdirSync("uploads");
    } else {
      console.log("folder upload exist");
    }

    console.log("FS:", ...fs.readdirSync("./"));

    next();
  }

  async uploadFileHandler(req, res) {
    if (
      (req.file && req.file.mimetype === "image/jpeg") ||
      (req.file && req.file.mimetype === "image/jpg")
    ) {
      const meta = req.body && JSON.parse(req.body.meta);

      const {
        title = "Без названия",
        description = "Без описания",
        folder = "/",
      } = meta;
      // console.log('meta:', meta);

      const fields = ["filename", "folder", "type"];
      const values = [
        `"${req.file.filename}"`,
        `"${folder}"`,
        `"${req.file.mimetype}"`,
      ];

      try {
        const upload = await s3.Upload(
          {
            path: path.resolve(`uploads${folder}`, req.file.filename),
            save_name: true,
          },
          folder
        );
        // console.log("S3 upload result:", upload);
        fields.push("aws");
        values.push(`"${upload.Location}"`);
      } catch (e) {
        console.log("S3 upload error:", e);
      }

      const q = `INSERT INTO \`${"files"}\` (\`${fields.join(
        "`, `"
      )}\`) VALUES ( ${values.join(",")} )`;

      // console.log('save file in db: ', q);

      try {
        const result = await this.context.dbe.queryList(q).toPromise();
        const insertedId = (
          result as any as { [key: string]: any; insertId: number }
        ).insertId;

        const qi = `INSERT INTO \`${"images"}\` ( \`file_id\`, \`title\`, \`description\`) VALUES ( ${insertedId}, "${title}", "${description}" )`;

        const _result = await this.context.dbe.queryList(qi).toPromise();

        res.status(201);
        res.send({
          status: "Файл загружен успешно, id: " + insertedId,
          file: {
            id: (_result as any as { [key: string]: any; insertId: number })
              .insertId,
          },
        });
      } catch (e) {
        res.status(500);
        res.send({ error: e });
        return;
      }
    } else {
      console.error(
        "error: ",
        "Ошибка типа файла. Поддерживаются только: jpeg",
        "file: ",
        req.file
      );
      res.status(500);
      res.send({ error: "Ошибка типа файла. Поддерживаются только: jpeg" });
    }
  }

  async downloadFileHandler(req, res) {
    const id = req.params.id;

    //SELECT `images`.*, files.id as fid, files.filename FROM `images`, files WHERE images.id = 2 AND files.id = images.file_id
    //SELECT `images`.*, files.id as fid, files.filename, files.type FROM `images` INNER JOIN files ON images.file_id = files.id WHERE files.type LIKE "%image%" AND images.id = 2

    if (!id) {
      res.status(500);
      res.send({ error: "не передан ID файла" });
    }

    const q = `SELECT * FROM \`files\` WHERE \`id\` = ${id}`;

    try {
      const result = this.context.dbe.queryList(q).toPromise();
      res.send({ result });
    } catch (e) {
      res.status(500);
      res.end({ error: e });
    }
  }

  async getCoreContragent(
    contragentId: number,
    contragentKey: EntityKeys
  ): Promise<Entity & { contragent?: number }> {
    return this.getEntities(contragentKey, null, null, contragentId)
      .pipe(map((list) => list[0]))
      .toPromise();
  }

  async getNestesContragent(
    contragentId: number,
    section: SectionKeys
  ): Promise<Entity> {
    const entKey: EntityKeys =
      section === "clinic"
        ? "ent_clinic_contragents"
        : "ent_consultation_contragents";
    return this.getEntities(entKey, null, {
      contragent: contragentId.toString(),
    })
      .pipe(map((list) => list[0]))
      .toPromise();
  }

  getRouter(): Router {
    entity.get(
      "/",
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        null
      ),
      this.rootHandler.bind(this)
    );

    entity.get(
      "/:id/filters",
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        null
      ),
      this.context.authorizationEngine.checkPrivateEntity.bind(
        this.context.authorizationEngine
      ),
      this.entityFilterHandler.bind(this)
    );

    entity.get(
      "/:id/set",
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        null
      ),
      this.context.authorizationEngine.checkPrivateEntity.bind(
        this.context.authorizationEngine
      ),
      this.entitySetHandler.bind(this)
    );

    entity.get(
      "/file/:id",
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        null
      ),
      this.downloadFileHandler.bind(this)
    );

    entity.get(
      "/:id",
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        null
      ),
      this.context.authorizationEngine.checkPrivateEntity.bind(
        this.context.authorizationEngine
      ),
      this.queryEntityHandler.bind(this)
    );

    entity.get(
      "/:id/:eid",
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        null
      ),
      this.context.authorizationEngine.checkPrivateEntity.bind(
        this.context.authorizationEngine
      ),
      this.queryEntityHandler.bind(this)
    );

    entity.post(
      "/file",
      jsonparser,
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        null
      ),
      this.checkUploadsFSHandler.bind(this),
      upload.single("photo"),
      this.uploadFileHandler.bind(this)
    );

    entity.delete(
      "/:id",
      jsonparser,
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        7
      ),
      this.context.authorizationEngine.checkPrivateEntity.bind(
        this.context.authorizationEngine
      ),
      this.deleteEntityHandler.bind(this)
    );

    entity.post(
      "/:id",
      jsonparser,
      this.context.authorizationEngine.checkAccess.bind(
        this.context.authorizationEngine,
        7
      ),
      this.context.authorizationEngine.checkPrivateEntity.bind(
        this.context.authorizationEngine
      ),
      this.createEntityHandler.bind(this)
    );

    return entity;
  }
}
