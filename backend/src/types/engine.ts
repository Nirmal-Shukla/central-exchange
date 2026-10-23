export type EngineCommandType = 
    | "create order"
    | "get_depth"
    | "get_user_balance"
    | "get_order"
    | "deposit"
    | "cancel_order"


export interface EngineResponse{
    correlationId:string;
    ok:boolean;
    data?:unknown;
    error?:string
}    

export interface EngineRequest {
  correlationId: string;
  responseQueue: string;
  type: EngineCommandType;
  payload: Record<string, unknown>;
}



