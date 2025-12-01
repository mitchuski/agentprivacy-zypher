const axios = require('axios');

async function zalletRpc(method, params = []) {
  const response = await axios.post('http://127.0.0.1:28232', {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  }, {
    auth: { username: 'swordsmanoracle1', password: 'soulbae$' }
  });
  return response.data;
}

async function main() {
  const res = await zalletRpc('z_listunspent', [0, 9999999]);

  if (res.error) {
    console.log('Error:', res.error.message);
    return;
  }

  const notes = res.result || [];
  console.log('Unspent notes:', notes.length);
  console.log('');

  notes.forEach((note, i) => {
    console.log('--- Note', i + 1, '---');
    console.log('TXID:', note.txid);
    console.log('Amount:', note.amount, 'ZEC');
    console.log('Confirmations:', note.confirmations);
    if (note.memo) {
      const buf = Buffer.from(note.memo, 'hex');
      let end = buf.length;
      while (end > 0 && buf[end-1] === 0) end--;
      if (end > 0 && buf[0] !== 0xf6) {
        const memoText = buf.slice(0, end).toString('utf8');
        console.log('Memo:', memoText);
      }
    }
    console.log('');
  });
}

main().catch(e => console.error('Error:', e.message));
