import { createClient } from "genlayer-js";
import { testnetBradbury, localnet } from "genlayer-js/chains";

export const getClient = (useLocal = false) => {
  if (typeof window !== "undefined" && window.ethereum) {
    return createClient({
      chain: useLocal ? localnet : testnetBradbury,
      provider: window.ethereum,
    });
  }
  return null;
};
