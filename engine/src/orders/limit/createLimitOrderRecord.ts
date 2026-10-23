import type { CreateOrderInput ,OrderRecord} from "../../store/exchangeStore";

export function createLimitOrderRecord(input:CreateOrderInput){
const orderId = crypto.randomUUID()
const order: OrderRecord = {
    orderId,
    userId: input.userId,
    side: input.side,
    type: input.type,
    symbol: input.symbol,
    price: input.price,
    qty: input.qty,
    filledQty: 0,
    status: "open",
    fills: [],
    createdAt: Date.now(),
  };

  return {
    orderId,
    order
  }
}

