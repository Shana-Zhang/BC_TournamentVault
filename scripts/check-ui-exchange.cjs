// Isolated frontend handler regression checks; no wallet, RPC or transactions.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ethers = require('ethers');
const source = fs.readFileSync(require('node:path').join(__dirname, '../ui/app.js'), 'utf8');
const fields = new Map();
const $ = name => {
  if (!fields.has(name)) fields.set(name, { value: '' });
  return fields.get(name);
};
let pending, requests, balance, reserve, allowance, credit, inventory;
const context = vm.createContext({ $, ethers, account: 'account',
  action: work => { pending = work(); },
  transact: async (label, request) => request,
  token: {
    balanceOf: async who => who === 'exchange' ? inventory : balance,
    allowance: async () => allowance,
    approve: (target, amount) => requests.push(['approve', target, amount]),
    transfer: (target, amount) => requests.push(['transfer', target, amount])
  },
  exchange: {
    target: 'exchange', TOKEN_UNITS_PER_WEI: async () => 1000000000n,
    quote: async amount => {
      if (amount <= 0n || amount % 1000000000n) throw new Error('Invalid precision');
      return amount / 1000000000n;
    },
    availableReserve: async () => reserve, ethCredits: async () => credit,
    redeem: amount => requests.push(['redeem', amount]),
    buy: options => requests.push(['buy', options.value]),
    withdrawETH: recipient => requests.push(['withdraw', recipient])
  },
  signer: { sendTransaction: options => requests.push(['fund', options.to, options.value]) }
});
vm.runInContext(source.slice(source.indexOf("$('redeem').onsubmit")), context);
const reset = () => {
  requests = []; balance = inventory = ethers.parseEther('1000');
  reserve = ethers.parseEther('1'); allowance = credit = 0n;
  $('redeem-amount').value = '500'; $('buy-amount').value = '0.0000005';
};
async function submit(name) { $(name).onsubmit({ preventDefault() {} }); await pending; }
(async () => {
  reset(); await submit('redeem');
  assert.deepEqual(requests.map(x => x[0]), ['approve', 'redeem']);
  assert.equal(requests[0][2], ethers.parseEther('500'));
  reset(); allowance = ethers.parseEther('500'); await submit('redeem');
  assert.deepEqual(requests.map(x => x[0]), ['redeem']);
  reset(); balance = 0n; await assert.rejects(submit('redeem'), /Insufficient LRT/); assert.equal(requests.length, 0);
  reset(); reserve = 0n; await assert.rejects(submit('redeem'), /Insufficient exchange ETH reserve/); assert.equal(requests.length, 0);
  reset(); $('redeem-amount').value = '0.0000000001'; await assert.rejects(submit('redeem'), /Invalid precision/); assert.equal(requests.length, 0);
  reset(); await submit('buy'); assert.deepEqual(requests, [['buy', 500000000000n]]);
  reset(); inventory = 0n; await assert.rejects(submit('buy'), /Insufficient exchange LRT inventory/); assert.equal(requests.length, 0);
  reset(); $('buy-amount').value = '0'; await assert.rejects(submit('buy'), /positive ETH/); assert.equal(requests.length, 0);
  reset(); $('exchange-withdraw').onclick(); await assert.rejects(pending, /No redemption ETH/); assert.equal(requests.length, 0);
  reset(); credit = 500000000000n; $('exchange-withdraw').onclick(); await pending; assert.deepEqual(requests, [['withdraw', 'account']]);
  reset(); $('fund-amount').value = '0.001'; await submit('reserve-fund'); assert.deepEqual(requests, [['fund', 'exchange', ethers.parseEther('0.001')]]);
  reset(); $('inventory-amount').value = '10000'; await submit('inventory-fund'); assert.deepEqual(requests, [['transfer', 'exchange', ethers.parseEther('10000')]]);
  reset(); $('inventory-amount').value = '0'; await assert.rejects(submit('inventory-fund'), /positive LRT/); assert.equal(requests.length, 0);
  console.log('13 isolated exchange handler scenarios passed. No wallet, network or blockchain transaction used.');
})().catch(error => { console.error(error); process.exitCode = 1; });
