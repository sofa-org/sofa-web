# DAPP

## Index prices

BTC and ETH try Binance public market data first, then Coinbase, then CoinGecko
`/simple/price`. Each external request has a five-second timeout and no automatic
retries. Invalid or non-positive prices also trigger the next source. Successful
quotes are cached for ten seconds, with a three-minute cache for CoinGecko.
Cached quotes retain their original retrieval timestamp. Binance and Coinbase use
USDT pairs; CoinGecko uses USD, preserving the existing approximate USD convention.

`MarketService.subscribeIndexPx(onSnapshot, onUpdate)` polls every ten seconds.
Its promise acknowledges subscription setup. The optional `onUpdate` callback
receives independent loading, success, and error events. RCH only uses SOFA's
`/rfq/exchange-rate` endpoint. scrvUSD and zRCH depend on their respective PPS
queries and base prices; they do not block BTC, ETH, or RCH updates. The displayed
derived quote uses the older timestamp of its two inputs.

`useIndexPrices.quotes` feeds the desktop and mobile ticker. A missing quote shows
`--`; failed refreshes preserve the last price and timestamp with a “Not updated”
label. WBTC follows BTC, while WETH and stETH follow ETH. A fifteen-second wait
limit reports slow requests without releasing the pending lock: an uncancellable
RPC cannot accumulate duplicate requests. A later successful response can recover
the quote. Unsubscribing stops polling and suppresses late updates.

`useIndexPrices.prices` continues to receive only complete snapshots for valuation
consumers. `fetchIndexPx()` retains all existing currencies and its legacy PPS=1
fallback on RPC rejection; that fallback is not published as a successful live
derived quote. Snapshot and live requests share caches and in-flight work. A hung
RPC may still delay a complete valuation snapshot, while the ticker continues to
update independently.

Related regression tests:

```bash
pnpm --filter @sofa/services exec vitest run test/market.test.ts
pnpm --filter dapp exec vitest run src/components/IndexPrices
```

## Automator Portfolio

Portfolio cards depend only on `/automator/list` and `/users/automator/list`. Personal position
amounts use the backend's `amountByClientDepositCcy`, and portfolio shares use
`amountByVaultDepositCcy / aumByVaultDepositCcy`, without waiting for market data, return
conversions, or on-chain net asset value requests.

ACTIVE and CLOSED positions are loaded and cached as separate snapshots by chain, wallet,
and status. Each completed request can update the page independently, with ACTIVE positions
taking precedence for the same contract. Failed requests show a retry prompt while preserving
data already loaded for the current wallet. The empty state appears only after a successful
query returns no valid positions.

After a successful deposit, redemption request, or claim, the success callback shared by
desktop and mobile immediately refreshes the personal position list without waiting for
detail or wallet balance requests. This refresh supersedes list requests that were still
pending before the transaction, preventing stale responses from overwriting updated positions.
If the backend has not finished indexing positions after on-chain confirmation, the existing
polling mechanism continues to update them every minute.

Related regression tests:

```bash
pnpm --filter dapp exec vitest run src/pages/products/automator/store.test.ts src/pages/products/automator-market/index.test.tsx
```
