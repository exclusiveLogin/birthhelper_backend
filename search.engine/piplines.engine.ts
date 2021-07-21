import {Observable, of} from "rxjs";
import {sectionClinicConfig} from "./config";

interface ClinicSetMini {
    average:number;
    min: number;
    max: number;
}

interface ClinicSetSummary extends ClinicSetMini{
    total: number;
}

interface PipeClinicResult_Item {
    id: number;
    set: ClinicSetMini;
}

interface PipeClinicResult {
    ids: PipeClinicResult_Item[];
    summarySet: ClinicSetSummary;
}

const clinicSectionKeys = sectionClinicConfig.clinic;
type keys = typeof clinicSectionKeys[number];

const pipelines: { [key in keys]: Observable<any> } = {
    clinic_facilities_birth_section: of(null),
    clinic_personal_birth_section: of(null),
    clinic_placement_birth_section: of(null),
    clinic_type_birth_section: of(null),
}

export class PiplinesEngine {
    constructor() {
    }

    query(config): Observable<any> {
        return
    }
}
