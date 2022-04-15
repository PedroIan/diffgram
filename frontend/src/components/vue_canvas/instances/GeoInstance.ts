import { Instance } from "./Instance";
import { v4 as uuidv4 } from 'uuid'
import { InstanceInterface } from "../../../helpers/interfaces/InstanceData";

interface Origin {
    lat: number;
    lng: number;
}

export class GeoCircle extends Instance implements InstanceInterface {
    public type: string = "geo_circle";
    public lonlat: Array<number>;
    public coords: Array<number>;
    public radius: number;

    constructor() {
        super();
    }

    public create_instance() {}

    public create_frontend_instance(
            lonlat: Array<number>, 
            coords: Array<any>, 
            radius: number, 
            label_file: any, 
            soft_delete: boolean = false
        ): void {
        this.lonlat = lonlat;
        this.coords = coords;
        this.radius = radius;
        this.soft_delete = soft_delete;
        this.creation_ref_id = uuidv4();
        this.label_file = label_file;
        this.label_file_id = label_file.id;
    }

    public get_instance_data() {
        const payload = {
            id: this.id || this.creation_ref_id,
            type: this.type,
            selected: this.selected,
            label_file: this.label_file,
            label_file_id: this.label_file_id,
            soft_delete: this.soft_delete,
            creation_ref_id: this.creation_ref_id,
            lonlat: this.lonlat,
            coords: this.coords,
            radius: this.radius
        }
        
        return payload
    }
}

export class GeoPoly extends Instance implements InstanceInterface {
    public bounds: Array<number>;
    public type: string;

    constructor(type: string) {
        super();
        this.type = type;
    }

    public create_instance() {}

    public create_frontend_instance(bounds: Array<number>, label_file: any, soft_delete: boolean = false): void {
        this.bounds = bounds;
        this.soft_delete = soft_delete;
        this.creation_ref_id = uuidv4();
        this.label_file = label_file;
        this.label_file_id = label_file.id;
    }

    public get_instance_data() {
        const payload = {
            id: this.id || this.creation_ref_id,
            type: this.type,
            selected: this.selected,
            label_file: this.label_file,
            label_file_id: this.label_file_id,
            soft_delete: this.soft_delete,
            creation_ref_id: this.creation_ref_id,
            bounds: this.bounds,
        }
        
        return payload
    }
}

export class GeoPoint extends Instance implements InstanceInterface {
    public lonlat: Array<number>;
    public coords: Array<number>;
    public type: string = "geo_point";

    constructor() {
        super();
    }

    public create_instance() {}

    public create_frontend_instance(
            lonlat: Array<number>,
            coords: Array<number>,
            label_file: any,
            soft_delete: boolean = false
        ): void {
        this.lonlat = lonlat;
        this.coords = coords;
        this.soft_delete = soft_delete;
        this.creation_ref_id = uuidv4();
        this.label_file = label_file;
        this.label_file_id = label_file.id;
    }

    public get_instance_data() {
        const payload = {
            id: this.id || this.creation_ref_id,
            type: this.type,
            selected: this.selected,
            label_file: this.label_file,
            label_file_id: this.label_file_id,
            soft_delete: this.soft_delete,
            creation_ref_id: this.creation_ref_id,
            lonlat: this.lonlat,
            coords: this.coords
        }
        
        return payload
    }
}

