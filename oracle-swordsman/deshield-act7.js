/**
 * Deshield Act 7 - Oracle Swordsman
 *
 * Step 1 in the Act 7 inscription flow:
 * 1. [THIS] Deshield → Act 7 P2SH (t3...) using z_sendmany
 * 2. [NEXT] Act 7 P2SH → Simple P2SH
 * 3. [FINAL] Simple P2SH → Inscription TX with envelope
 *
 * Act 7: Mirror Enhanced / Two-Agent Witness
 * Proverb: "One agent gives the mirror completion; two agents give it only
 * the shimmer and in their mutual witness, the First Person remains forever uncaptured."
 */

const axios = require('axios');
const crypto = require('crypto');

// Zallet RPC configuration
const ZALLET_RPC = 'http://127.0.0.1:28232';
const ZALLET_USER = 'swordsmanoracle1';
const ZALLET_PASS = 'soulbae$';

// Amount to deshield (golden ratio style: 0.00618034 ZEC = 618034 zatoshis)
const DESHIELD_AMOUNT = 0.00618034;

// Act 7 P2SH address components
// Redeem script: OP_7 OP_DROP <pubkey> OP_CHECKSIG
// OP_7 = 0x57, OP_DROP = 0x75, <pubkey 33 bytes>, OP_CHECKSIG = 0xac
const PUBKEY = '03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223';

// Build Act 7 redeem script
function buildAct7RedeemScript() {
  // OP_7 OP_DROP <pubkey> OP_CHECKSIG
  const script = Buffer.concat([
    Buffer.from([0x57]),           // OP_7
    Buffer.from([0x75]),           // OP_DROP
    Buffer.from([0x21]),           // Push 33 bytes
    Buffer.from(PUBKEY, 'hex'),    // pubkey (33 bytes compressed)
    Buffer.from([0xac])            // OP_CHECKSIG
  ]);
  return script;
}

// Calculate P2SH address from redeem script
function redeemScriptToP2SH(redeemScript) {
  // SHA256(redeemScript)
  const sha256Hash = crypto.createHash('sha256').update(redeemScript).digest();
  // RIPEMD160(SHA256(redeemScript))
  const hash160 = crypto.createHash('ripemd160').update(sha256Hash).digest();

  // P2SH address for mainnet: version 0x1c, 0xbd (t3...)
  const version = Buffer.from([0x1c, 0xbd]);
  const payload = Buffer.concat([version, hash160]);

  // Double SHA256 for checksum
  const checksum = crypto.createHash('sha256')
    .update(crypto.createHash('sha256').update(payload).digest())
    .digest()
    .slice(0, 4);

  const address = Buffer.concat([payload, checksum]);

  // Base58 encode
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = BigInt('0x' + address.toString('hex'));
  let result = '';
  while (num > 0) {
    result = ALPHABET[Number(num % BigInt(58))] + result;
    num = num / BigInt(58);
  }
  // Add leading '1's for leading zeros
  for (const byte of address) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

async function zalletRpc(method, params = []) {
  const response = await axios.post(ZALLET_RPC, {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  }, {
    auth: { username: ZALLET_USER, password: ZALLET_PASS }
  });
  if (response.data.error) {
    throw new Error(response.data.error.message);
  }
  return response.data.result;
}

async function waitForOperation(opid) {
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const status = await zalletRpc('z_getoperationstatus', [[opid]]);

    if (!status || status.length === 0) {
      attempts++;
      continue;
    }

    const op = status[0];
    if (op.status === 'success' && op.result) {
      return op.result.txid;
    } else if (op.status === 'failed') {
      throw new Error(op.error?.message || 'Operation failed');
    }

    process.stdout.write('.');
    attempts++;
  }
  throw new Error('Operation timeout');
}

async function main() {
  console.log('=== Deshield Act 7 - Oracle Swordsman ===\n');

  // Build Act 7 P2SH address
  const redeemScript = buildAct7RedeemScript();
  const act7P2SH = redeemScriptToP2SH(redeemScript);

  console.log('Act 7 Redeem Script:', redeemScript.toString('hex'));
  console.log('Act 7 P2SH Address:', act7P2SH);
  console.log('Deshield Amount:', DESHIELD_AMOUNT, 'ZEC');
  console.log('');

  // Get source address (unified address with funds)
  console.log('Getting source address...');
  const unspent = await zalletRpc('z_listunspent', [1]);
  if (!unspent || unspent.length === 0) {
    console.error('No unspent shielded notes found');
    return;
  }

  // Find the best note to spend from
  const sorted = unspent.sort((a, b) => (b.value || b.amount) - (a.value || a.amount));
  const bestNote = sorted[0];
  console.log('Best note:', bestNote.txid, 'value:', bestNote.value || bestNote.amount);

  // Get the unified address for this account
  let fromAddress;
  if (bestNote.account_uuid) {
    const accounts = await zalletRpc('z_listaccounts');
    const account = accounts?.find(a => a.account_uuid === bestNote.account_uuid);
    if (account && account.addresses && account.addresses.length > 0) {
      fromAddress = account.addresses[0].ua;
    }
  }

  if (!fromAddress) {
    // Fallback to address listing
    const result = await zalletRpc('listaddresses');
    if (result && result[0]?.unified?.[0]?.addresses?.[0]) {
      fromAddress = result[0].unified[0].addresses[0].address;
    }
  }

  if (!fromAddress) {
    console.error('Could not find source unified address');
    return;
  }

  console.log('From Address:', fromAddress.substring(0, 30) + '...');
  console.log('');

  // Build z_sendmany recipients
  // We're sending to a transparent P2SH, so no memo possible on destination
  const recipients = [{
    address: act7P2SH,
    amount: DESHIELD_AMOUNT
  }];

  console.log('Sending deshield transaction...');
  console.log('  To:', act7P2SH);
  console.log('  Amount:', DESHIELD_AMOUNT, 'ZEC');
  console.log('');

  // Execute z_sendmany with AllowRevealedRecipients policy (needed for t3 addresses)
  const opid = await zalletRpc('z_sendmany', [
    fromAddress,
    recipients,
    1,              // minconf
    null,           // fee (default)
    'AllowRevealedRecipients'  // privacy policy (required for transparent output)
  ]);

  console.log('Operation ID:', opid);
  console.log('Waiting for confirmation');

  const txid = await waitForOperation(opid);

  console.log('\n\n=== SUCCESS ===');
  console.log('Deshield TXID:', txid);
  console.log('');
  console.log('Next steps:');
  console.log('1. Wait for 1 confirmation');
  console.log('2. Run spend-act7-to-simple-p2sh.js with this UTXO:');
  console.log('   UTXO.txid =', `'${txid}'`);
  console.log('   UTXO.vout = 0');
  console.log('   UTXO.amount =', Math.round(DESHIELD_AMOUNT * 100000000), 'zatoshis');
  console.log('');
  console.log('Act 7 P2SH scriptPubKey: a914' + crypto.createHash('ripemd160')
    .update(crypto.createHash('sha256').update(redeemScript).digest())
    .digest('hex') + '87');
}

main().catch(console.error);
