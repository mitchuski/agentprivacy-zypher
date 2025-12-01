# Correct zecwallet-cli Startup Command

## Problem

When running:
```powershell
zecwallet-cli --server http://127.0.0.1:9067 --network mainnet
```

You get:
```
error: Found argument '--network' which wasn't expected
```

## Solution

**Your version of zecwallet-cli doesn't support the `--network` flag.**

Use this command instead:

```powershell
zecwallet-cli --server http://127.0.0.1:9067
```

## How Network Detection Works

zecwallet-cli automatically detects the network from lightwalletd:
- lightwalletd queries zebrad to get network info
- zecwallet-cli gets network info from lightwalletd via gRPC
- No need to specify `--network` manually

## Complete Startup Steps

1. **Start zecwallet-cli:**
   ```powershell
   zecwallet-cli --server http://127.0.0.1:9067
   ```

2. **Wait for connection** - You should see:
   ```
   (main) Block:XXXXX (type 'help') >>
   ```
   The `(main)` indicates mainnet was detected.

3. **Import viewing key:**
   ```bash
   import-viewing-key zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c
   ```

4. **Watch block number increase** - Should start syncing automatically

## Verify Network

After connecting, check the prompt:
- `(main) Block:XXXXX` = Mainnet ✅
- `(test) Block:XXXXX` = Testnet ❌ (wrong network)

If it shows testnet, there's an issue with lightwalletd configuration.

## Troubleshooting

### If Network Detection Fails

If zecwallet-cli can't detect network:
1. **Check lightwalletd is running:**
   ```powershell
   Get-Process lightwalletd
   ```

2. **Check lightwalletd logs:**
   ```powershell
   Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 10
   ```

3. **Restart lightwalletd** if needed

### If Block Number Doesn't Update

1. **Wait a minute** - First sync can be slow
2. **Check lightwalletd is syncing** (logs show "Adding block")
3. **Restart zecwallet-cli** if still stuck

---

**Just use: `zecwallet-cli --server http://127.0.0.1:9067` (no --network flag needed)!**

