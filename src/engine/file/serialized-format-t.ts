import { jsonable } from "./json";
import { int } from "../splitTime";
export type serialized_format_t = {
    [typeId: string]: jsonable;
};
export type serialized_object_bucket_t = {
    [objectId: number]: jsonable;
};
export type serialized_object_t = int;
