import { createClient } from "redis";
import { env } from "./src/utils/env";
import { handleCreateOrder } from "./src/orders/handleCreateOrder";

export type  engineCommandType = 
| "deposit"
| "create_order"
| "get_depth"
| "get_user_balance"
| "get_order"
| "cancel_order";

export interface EngineRequest{
correlationId:string;
responseQueue:string;
type:engineCommandType;
payload:Record<string,unknown>
}

export interface EngineResponse {
  correlationId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}


const brokerClient =  createClient({url:env.redisUrl}).on(
    "error",
    (error) => {
    console.error("Redis broker client error", error);
  },
)

const responseClient = createClient({ url: env.redisUrl }).on(
  "error",
  (error) => {
    console.error("Redis response client error", error);
  },
);

const streamClient = createClient({ url: env.redisUrl }).on(
  "error",
  (error) => {
    console.error("Redis stream client error", error);
  },
);

await Promise.all([
  brokerClient.connect(),
  responseClient.connect(),
  streamClient.connect(),
]);


const DUMMY_SELL_ORDER = {
  orderId: "dummy-sell-order-1",
  userId: "dummy-seller",
  type: "limit",
  side: "sell",
  symbol: "BTC",
  price: 100,
  qty: 1,
  filledQty: 0,
  status: "open",
};

async function sendResponse(responseQueue:String,response:EngineResponse):Promise<void> {
    await responseClient.lPush(responseQueue,JSON.stringify(response))
}

async function handleEngineRequest(message:EngineRequest):Promise<unknown> {

    if(message.type === "create_order"){
        const result = handleCreateOrder(message.payload)
        return result
    }
    

}