import { createClient } from "redis";
import { env } from "../../utils/env";
import type { EngineCommandType, EngineResponse,EngineRequest } from "../types/engine";
import { waitForEngineResponse,resolveEngineResponse } from "../store/pendingResponse";
import { resolve } from "node:dns";
import { response } from "express";

const engineTimOutValue = 30000;

const publisher = createClient({ url: env.redisUrl }).on("error", (error) => {
  console.error("Redis publisher error", error);
});

const subscriber = createClient({ url: env.redisUrl }).on("error", (error) => {
  console.error("Redis subscriber error", error);
});


export async function connectRedis(): Promise<void> {
  await Promise.all([
    publisher.connect(), 
    subscriber.connect()
  ]);
}

export async function pingRedis(): Promise<string> {
  return publisher.ping();
}


export const sendToEngine =  async function (
  type:EngineCommandType,
    payload: Record<string, unknown>,
):Promise<EngineResponse>{
  
const correlationId = crypto.randomUUID() 
const responsePromise = waitForEngineResponse(
  correlationId,
   env.engineTimeoutMs,
)

const message: EngineRequest = {
    correlationId,
    responseQueue: env.responseQueue,
    type,
    payload,
};
  console.log("Sending to engine:", message);
  await publisher.lPush(env.incomingQueue, JSON.stringify(message));
  return responsePromise;
}

export async function listenForEngineResponses(): Promise<void> {
  console.log(`Listening for engine responses on ${env.responseQueue}`);

  for (;;) {
    try {
      const response = await subscriber.brPop(env.responseQueue, 0);
    if (!response) continue;
        console.log("Backend received response:", response.element);
         
    
    try {
      const parsedResponse = JSON.parse(response.element) as EngineResponse;
      resolveEngineResponse(parsedResponse);
    } catch (error) {
      console.error("Invalid engine response parsing", error);
    }}
    catch(redisError){
      console.log("redis brpop execution is failed ",redisError)
      await new Promise(resolve=> setTimeout(resolve,1000))
    }
  }
}



