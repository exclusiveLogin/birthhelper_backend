import { Entity } from "./entity_engine";


export function hideFields<T extends Entity>(entity: T, fieldNames: string[]): T {
    Object.keys(entity).forEach(fieldName => fieldNames.includes(fieldName) ? delete entity[fieldName] : entity);
    return entity;
}