import "dotenv/config";
import { syncChampionsFromRiot } from "../data/champion-store.js";

const { version, champions } = await syncChampionsFromRiot();
console.log(
  `Synced ${champions.length} champions from Riot Data Dragon version ${version}.`
);
