 import type { CreateOrderInput } from "../store/exchangeStore"



export function handleCreateOrder(payload:Record<string,unknown>) {
    const input = payload as unknown as CreateOrderInput
    
}