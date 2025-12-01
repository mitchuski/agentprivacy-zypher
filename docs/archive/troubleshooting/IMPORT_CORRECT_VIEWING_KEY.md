# Import Correct Viewing Key and Verify Transaction

## Your Address Details

- **Address**: `zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t`
- **Viewing Key**: `zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c`

## Step-by-Step Fix

### Step 1: Verify Transaction Address

First, confirm you sent the transaction to this address:
- Check your transaction on the explorer: https://mainnet.zcashexplorer.app/transactions/24c1867dfd911e8b2e2213d91f14a9928ef35a3046ae03be47cb2972c525ee84
- Verify the receiving address matches: `zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t`

### Step 2: Import Viewing Key in zecwallet-cli

In your zecwallet-cli terminal:

```bash
import-viewing-key zxviews1qwu8xma4qqqqpq9msrvf23sh4y582lkx5tppjnwc68ecc2mwccct4wlqr0d5848fe2cu8g673yphm6jcrmzuyaeuvc66udy7ruv7s3y8phv2racsaa7trfx4wwdp3hupvkurnt8pgs2f46p3wvsarlh62eqsg89jl8j2fvkj6jc2ejcxhlpx87cv07mp2g8474lzxcrsh0uhnuenflv5ye7tre03wwk9syfw5nenhkn6rs22recmt5umnrptnka77js8xjr7cdzw25qr8ft2c
```

You should see: `Success` or similar confirmation.

### Step 3: Verify Address Appears

```bash
list
# or
addresses
```

You should see your address: `zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t`

### Step 4: Rescan from Transaction Block

```bash
rescan 3150150
```

This will rescan from block 3150150 (just before your transaction at 3150152).

**Note:** Rescan may take a few minutes. Let it run.

### Step 5: Check Balance Again

After rescan completes:

```bash
balance
```

You should now see:
- `verified_zbalance`: 1000000 (0.001 ZEC)
- `spendable_zbalance`: 1000000 (0.001 ZEC)
- `unverified_zbalance`: 0

## Troubleshooting

### If Address Doesn't Appear After Import

1. **Check for errors** when importing viewing key
2. **Try importing again** - sometimes it needs a second attempt
3. **Verify viewing key is correct** - copy/paste carefully

### If Balance Still Unverified After Rescan

1. **Check rescan completed** - wait for it to finish
2. **Try rescan from earlier block:**
   ```bash
   rescan 419200  # From Sapling activation
   ```
3. **Verify transaction address** - make sure you sent to the right address
4. **Check lightwalletd is synced:**
   ```powershell
   Get-Content "$env:USERPROFILE\lightwalletd-data\lightwalletd.log" -Tail 10
   ```

### If Viewing Key Import Fails

1. **Check zecwallet-cli is connected:**
   - Should show `(main) Block:XXXXX` in prompt
   - If not, reconnect: `zecwallet-cli --server http://127.0.0.1:9067`

2. **Check lightwalletd is running:**
   ```powershell
   Get-Process lightwalletd
   ```

3. **Restart zecwallet-cli** and try again

## Expected Result

After completing all steps:
- ✅ Address appears in `list` command
- ✅ `balance` shows verified balance
- ✅ Transaction appears in transaction list
- ✅ Balance is spendable

---

**Follow these steps in order, and your transaction should be verified!**

