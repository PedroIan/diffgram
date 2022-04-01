export interface InstanceData {
    id: number | string;
    creation_ref_id: string;
    type: string;
    selected: boolean;
    label_file: any;
    label_file_id: number;
    soft_delete: boolean;
}

export interface TextInstanceData extends InstanceData {
    start_token: string;
    end_token: string;
    text_tokenizer: string;
}

export interface InstanceInterface extends InstanceData {
    create_instance: Function;
    create_frontend_instance: Function;
    get_instance_data: Function;
}

export interface RelationInstanceData extends InstanceData {
    from_instance_id: number | string;
    to_instance_id: number | string;
    text_tokenizer: string;
}