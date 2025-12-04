/**
 * List shielded transactions via z_listtransactions
 */
const axios = require('axios');
require('dotenv').config();

async function main() {
  const user = process.env.ZALLET_RPC_USER;
  const pass = process.env.ZALLET_RPC_PASS;

  console.log('Connecting to Zallet RPC...');

  // Oracle UA address
  const oracleUA = 'u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um';

  // Use z_listreceivedbyaddress to get received transactions with memos
  const response = await axios.post('http://127.0.0.1:28232', {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'z_listreceivedbyaddress',
    params: [oracleUA, 1]  // address, minconf
  }, {
    auth: { username: user, password: pass },
    timeout: 30000
  });

  if (response.data.error) {
    console.error('Error:', response.data.error);
    return;
  }

  const notes = response.data.result || [];
  console.log('=== Shielded Notes ===');
  console.log('Total:', notes.length);
  console.log('');

  // Show ALL notes with memos (proverb submissions have memos)
  const proverbs = notes.filter(n => n.memo && n.memo !== '');
  console.log('Notes with memos:', proverbs.length);
  console.log('');

  for (const note of proverbs) {
    console.log('TXID:', note.txid);
    console.log('Amount:', note.amount, 'ZEC');
    console.log('Confirmations:', note.confirmations);
    console.log('Pool:', note.pool);
    if (note.memo) {
      const memoText = Buffer.from(note.memo, 'hex').toString('utf-8').replace(/\x00+$/g, '');
      console.log('Memo:', memoText.substring(0, 500));
    }
    console.log('---');
  }
}

main().catch(err => console.error('Error:', err.message));
