import {initSync, get_wasm} from "@wgb5445/aptos-intent-npm";
export * from "@wgb5445/aptos-intent-npm";
export async function init(){
    return initSync(await get_wasm())
}