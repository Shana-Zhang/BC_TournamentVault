# TournamentVault V3

Zhang Shihan · 21317896 · CSIT5760

ETH prize escrow at creation, optional LRT bonus funded before entry, ranked results, participant objections, independent resolver permissions and individual payouts. Three production contracts: LearningRewardToken, TournamentVaultV3 and LRTExchange.

## Reproduce

Prerequisites: Node.js 22 or 24, npm, and MetaMask for browser interaction.

```
npm ci
npm run compile
npm test
npm run analyze
npm run config:check
npm run serve
```

Open http://127.0.0.1:8080/ with MetaMask on Sepolia (11155111). Existing deployment addresses are listed below. Select a connected account, load tournament 1 and inspect the finalized ranking and activity. Account 1 is organizer, account 2 referee, account 3 resolver, and accounts 4-6 players in the demonstration. Roles are assigned per tournament. Each transaction requires wallet confirmation. Use test ETH only.

For a fresh local chain, run npm run node, then npm run deploy:local:v3 in another terminal, then npm run serve. The local deployment updates ui/config.json to chain 31337. Preserve the Sepolia configuration before doing this. Deploying all three contracts on Sepolia is also supported by /deploy.html; do not redeploy to review the recorded event. Verification: npm run verify:sepolia:v3, with dedicated test credentials in an excluded .env copied from .env.example. Read-only check: npm run check:sepolia:v3. No credential file belongs in a submission.

## Tests and evidence

The submitted V3-only suite has 51 passing Hardhat local EVM tests. It covers exact ETH escrow; ranked payouts and liabilities; zero bonus; funded and unfunded cancellation refunds; deadline recovery; rejected delivery and reentrancy; cancellation after registration and non-referee submission; exact registration deadline and duplicate prize withdrawal; invalid roles and wrong fees; and the exchange round trip and repeated withdrawal. Tests assert balances, credits, state and expected revert messages. Run npm test. The current suites are test/v3-prize.test.js and test/v3-controls.test.js. Sepolia evidence separately records 20 successful wallet transactions for tournament #1 and the exchange; these are public lifecycle demonstrations.

## Deployment

LearningRewardToken: 0xE6b0239029382019323daca86A798364AEc5E637; block 12194297; UTC 2026-11-23T07:41:24.000Z; tool: Browser wallet deployment page ui/deploy.html using ethers 6.17.0 and MetaMask; constructor arguments: ["0xdE3d23a1245f07859279b759b528615Eb55BcAc4", "1000000000000000000000000"]; https://sepolia.etherscan.io/address/0xE6b0239029382019323daca86A798364AEc5E637#code
TournamentVaultV3: 0xbb74eEca21239034cCdB3e9244256DAd7A664FDb; block 12194299; UTC 2026-11-23T07:41:48.000Z; tool: Browser wallet deployment page ui/deploy.html using ethers 6.17.0 and MetaMask; constructor arguments: ["0xE6b0239029382019323daca86A798364AEc5E637"]; https://sepolia.etherscan.io/address/0xbb74eEca21239034cCdB3e9244256DAd7A664FDb#code
LRTExchange: 0xEc6dc026d5E0a9F50fDcd42d21EA724a751a1e6B; block 12194305; UTC 2026-11-23T07:43:00.000Z; tool: Browser wallet deployment page ui/deploy.html using ethers 6.17.0 and MetaMask; constructor arguments: ["0xE6b0239029382019323daca86A798364AEc5E637"]; https://sepolia.etherscan.io/address/0xEc6dc026d5E0a9F50fDcd42d21EA724a751a1e6B#code

Compiler: Solidity 0.8.26; optimizer enabled, 200 runs; Cancun EVM. No externally linked libraries. Constructor arguments are encoded into the deployment transaction. Recorded deployment inputs and runtime bytecode match the local build; explorer sources are verified.

## Libraries and acknowledgements

- @nomicfoundation/hardhat-chai-matchers: 2.1.2
- @nomicfoundation/hardhat-ethers: 3.1.3
- @nomicfoundation/hardhat-network-helpers: 1.1.2
- @nomicfoundation/hardhat-verify: 2.1.4
- @openzeppelin/contracts: 5.6.1
- chai: 4.5.0
- dotenv: 16.6.1
- ethers: 6.17.0
- hardhat: 2.29.2
- solc: 0.8.26
- solidity-coverage: 0.8.17

AI assistance was used for part of this project. The author is responsible for the final content. OpenZeppelin provides the reused ERC20, SafeERC20, ReentrancyGuard and Math components.

## Security and operating rules

V3 manual review covers role checks, exact payment validation, immutable rules, post-entry cancellation restrictions, deadline recovery, credits cleared before external calls, ReentrancyGuard, checked ETH delivery, SafeERC20, bounded ranking loops and separate asset liabilities. The local tests exercise the affected controls and preserve credits after a rejected transfer. The current compiler/AST analysis is audit/static-analysis.json. Referee and resolver decisions rely on off-chain evidence and distinct addresses do not prove independent people. Exchange redemption requires available backing. Deadline-sensitive actions need mining time. This coursework review is scoped and is not an independent audit.

The 0.001 ETH and 1 LRT public demonstration uses 50/30/20 shares; entry fee is 0.001 ETH. Editable UI defaults are examples. Entry fees credit the organizer only after finalization. Cancellation enables individual fee refunds and returns prize escrow. Exchange quote is 1 LRT per 1,000,000,000 wei; returned LRT remains inventory.


## Submission

Repository: https://github.com/Shana-Zhang/BC_TournamentVault

Final report: docs/TournamentVault_V3_Final_Report.pdf and matching .docx. Report source: scripts/build-report.py, requiring Python with python-docx. Use the retained course template in reference/. Build with python scripts/build-report.py; export the result with Word and refresh the table of contents. The report is supplied as a final artifact, so Python is not needed to compile/test the contracts.
