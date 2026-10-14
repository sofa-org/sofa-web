# DAPP

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
