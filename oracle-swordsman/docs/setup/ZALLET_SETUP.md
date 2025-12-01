# Zallet Setup Guide

**Zallet** is the new Zcash wallet CLI that works with zebrad. It's the recommended wallet tool for your setup.

## Why Zallet?

- ✅ Works with **zebrad** (which you're already using)
- ✅ Modern Rust implementation (replacing zcashd wallet)
- ✅ Command-line interface for automation
- ⚠️ Currently in **alpha** (may have limitations)

## Installation

### Option 1: Build from Source (Recommended)

```powershell
# Install Rust if you don't have it
# Visit: https://rustup.rs/

# Clone and build zallet
git clone https://github.com/zcash/wallet.git
cd wallet
cargo build --release

# Add to PATH (or use full path)
# Binary will be at: target/release/zallet.exe
```

### Option 2: Download Pre-built Binary

Check the [zallet releases](https://github.com/zcash/wallet/releases) for Windows binaries.

## Quick Start with Zallet

### 1. Initialize Wallet

```powershell
# Create a new wallet
zallet init-wallet-encryption --data-dir "C:\Users\mitch\zebra-wallet"
```

### 2. Generate Addresses

```powershell
# Start zallet (connects to your zebrad node)
zallet start --data-dir "C:\Users\mitch\zebra-wallet"

# In zallet CLI or via RPC:
# Generate shielded address
zallet rpc z_getnewaddress sapling

# Generate transparent address  
zallet rpc getnewaddress
```

### 3. Export Viewing Keys

```powershell
# Export viewing key for an address
zallet rpc z_exportviewingkey <your-z-address>
```

## Alternative: zcash-cli (Traditional)

If zallet is too complex or you prefer the traditional approach:

### Install zcashd (includes zcash-cli)

```powershell
# Download zcashd for Windows
# Or use Docker:
docker pull electriccoinco/zcashd
docker run -d -p 8232:8232 electriccoinco/zcashd
```

### Use zcash-cli

```powershell
# Point zcash-cli to your zebrad node
zcash-cli -rpcport=8233 -rpcuser=<user> -rpcpassword=<pass> z_getnewaddress sapling
zcash-cli -rpcport=8233 -rpcuser=<user> -rpcpassword=<pass> z_exportviewingkey <address>
```

## For Your Current Setup

Since you already have addresses, you just need to export viewing keys:

1. **If you have zallet:**
   ```powershell
   zallet rpc z_exportviewingkey zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t
   ```

2. **If you have zcash-cli:**
   ```powershell
   # Read cookie file for auth
   $cookie = Get-Content "$env:LOCALAPPDATA\zebra\.cookie"
   $creds = $cookie.Trim().Split(':')
   
   zcash-cli -rpcport=8233 -rpcuser=$creds[0] -rpcpassword=$creds[1] z_exportviewingkey zs1p5dclcm74pmg0zhsdk9jqnrlnxua83zm6my33uayg0hwranh6w2k3s4uaaezl6fg38ua2jkq64t
   ```

3. **If you used a mobile wallet (Zashi):**
   - Export viewing key from the mobile wallet app
   - Or use the wallet's export feature

## Recommendation

**For your setup:**
- ✅ **Use zallet** if you want the modern, future-proof solution
- ✅ **Use zcash-cli** if you need something stable right now (but requires zcashd)
- ✅ **Use your existing wallet** if you already have the addresses there

Since you're using zebrad, zallet is the most consistent choice, but it's in alpha so may have limitations.

## Resources

- **Zallet Docs:** https://zcash.github.io/wallet/cli/index.html
- **Zallet GitHub:** https://github.com/zcash/wallet
- **Zcashd Docker:** https://hub.docker.com/r/electriccoinco/zcashd (if you need zcash-cli)

