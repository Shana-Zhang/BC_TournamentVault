// Exercise the actual browser handlers without an injected wallet or network.
const fs = require('fs');
const vm = require('vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('path').join(__dirname, '../ui/app.js'), 'utf8');
const policy = source.slice(source.indexOf('function updateRoleInterface('), source.indexOf('async function readEventLogs('));
const guard = source.slice(source.indexOf('async function requireAllowedTournamentAction('), source.indexOf("$('actions').onclick"));
const actions = source.slice(source.indexOf("$('actions').onclick"), source.indexOf("$('create').onsubmit"));
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { hidden: true, dataset: {}, textContent: '', querySelector: key => element(id + key) });
  return elements.get(id);
}
const buttons = ['open','register','cancel','lock','finalize','prize','fees','refund','organizer-refund','timeout'].map(action => ({hidden:true,dataset:{action,role:({open:'organizer',cancel:'organizer',register:'eligible',prize:'prize-credit',fees:'eth-credit',refund:'registered','organizer-refund':'organizer'})[action] || 'any'}}));
let requested = 0, refreshes = 0, pending;
const ctx = vm.createContext({
  account:'player', vault:{ethPrizeCredits(){},target:'vault'}, $:element,
  document:{querySelectorAll:()=>buttons},
  requireTournament:()=>1n,
  refresh:async()=>{refreshes++;ctx.updateRoleInterface(ctx.t,true,0n,0n,false,false,100);},
  action:work=>{pending=work();},
  token:{allowance:async()=>0n,approve:()=>{requested++;return 'approve';}},
  transact:async(label,tx)=>tx
});
vm.runInContext(policy+guard+actions,ctx);
ctx.t={organizer:'organizer',referee:'referee',resolver:'resolver',state:5,playerCount:3,rules:{registrationDeadline:50,resultDeadline:90,lrtBonus:100n},disputeDeadline:95,resolutionDeadline:99};
ctx.tournament=ctx.t;
(async()=>{
  ctx.updateRoleInterface(ctx.t,true,0n,0n,false,false,100);
  assert(buttons.every(b=>!b.hidden),'All tournament buttons remain visible');
  assert.equal(element('results').hidden,false);assert.equal(element('dispute').hidden,false);assert.equal(element('results-card').hidden,false);
  const button=buttons.find(b=>b.dataset.action==='open');
  // A stale allowed flag must not cause even a token approval request.
  button.dataset.allowed='true';element('actions').onclick({target:{closest:()=>button}});
  await assert.rejects(pending,/No transaction requested/);assert.equal(requested,0);assert.equal(refreshes,1);
  ctx.account='organizer';ctx.t.state=0;ctx.t.playerCount=0;ctx.t.rules.registrationDeadline=200;
  ctx.vault.fundAndOpen=()=>{requested++;return 'open';};
  element('actions').onclick({target:{closest:()=>button}});await pending;
  assert.equal(requested,2,'Valid organizer action still requests exact approval and funding');
  ctx.account='player';ctx.t.state=4;ctx.updateRoleInterface(ctx.t,true,0n,0n,false,false,100);
  assert.equal(element('results[name="mode"][value="resolve"]').dataset.allowed,'false');
  assert.equal(element('results[name="mode"][value="submit"]').dataset.allowed,'false');
  ctx.account='resolver';ctx.t.resolutionDeadline=200;
  ctx.updateRoleInterface(ctx.t,true,0n,0n,false,false,100);
  assert.equal(element('results[name="mode"][value="resolve"]').dataset.allowed,'true','Designated resolver can act during a live dispute');
  assert.equal(element('results[name="mode"][value="submit"]').dataset.allowed,'false','Resolver does not gain referee permission');
  console.log('UI guard checks passed: visible controls; stale/unauthorized clicks request no wallet transaction; eligible actions remain functional.');
})().catch(e=>{console.error(e);process.exitCode=1;});
