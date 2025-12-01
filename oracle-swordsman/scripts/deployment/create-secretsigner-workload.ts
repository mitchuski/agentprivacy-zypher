/**
 * Create Nillion Workload for SecretSigner
 * Sets up a nilCC workload to run SecretSigner service for Zcash transaction signing
 */

import { NillionWorkloadClient } from '../../src/nillion-workload-client';
import logger from '../../src/logger';

async function createSecretSignerWorkload() {
  console.log('======================================');
  console.log('Create SecretSigner Workload');
  console.log('======================================\n');

  const workloadClient = new NillionWorkloadClient();

  try {
    // Step 1: List available resources
    console.log('[1] Checking available resources...');
    const tiers = await workloadClient.listWorkloadTiers();
    const artifacts = await workloadClient.listArtifacts();

    console.log(`  ✅ Found ${tiers.length} workload tiers`);
    console.log(`  ✅ Found ${artifacts.length} artifacts\n`);

    // Step 2: Choose a tier (use smallest for now - 2 CPU)
    const selectedTier = tiers[0] || { cpus: 2, memory: 2048, disk: 20, gpus: 0, cost: 33 };
    const selectedArtifact = artifacts[0]?.version || '0.2.1';

    console.log('[2] Selected configuration:');
    console.log(`  Tier: ${selectedTier.cpus} CPUs, ${selectedTier.memory || 2048} MB RAM, ${selectedTier.disk || 20} GB disk`);
    console.log(`  Cost: ${selectedTier.cost} credits`);
    console.log(`  Artifact: ${selectedArtifact}\n`);

    // Step 3: Create workload with SecretSigner service
    console.log('[3] Preparing SecretSigner workload configuration...\n');

    // SecretSigner Docker Compose configuration
    // This is a template - actual SecretSigner service needs to be implemented
    const dockerCompose = `
version: '3.8'

services:
  secret-signer:
    image: nillion/secret-signer:latest  # TODO: Replace with actual SecretSigner image
    container_name: oracle-secret-signer
    ports:
      - "8080:8080"
    environment:
      - PRIVATE_KEY=${PRIVATE_KEY}
      - NETWORK=mainnet
      - LOG_LEVEL=info
    command: 
      - "--port"
      - "8080"
      - "--network"
      - "mainnet"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
`.trim();

    const workloadConfig = {
      name: 'oracle-secret-signer',
      artifactsVersion: selectedArtifact,
      dockerCompose: dockerCompose,
      envVars: {
        PRIVATE_KEY: 'PLACEHOLDER_WILL_BE_SET_AFTER_KEY_GENERATION',
        NETWORK: 'mainnet',
        LOG_LEVEL: 'info',
      },
      publicContainerName: 'secret-signer',
      publicContainerPort: 8080,
      memory: selectedTier.memory || 2048,
      cpus: selectedTier.cpus,
      disk: selectedTier.disk || 20,
      gpus: selectedTier.gpus || 0,
    };

    console.log('  ✅ Workload configuration prepared');
    console.log('  📋 Configuration details:');
    console.log(`     Name: ${workloadConfig.name}`);
    console.log(`     Artifact: ${workloadConfig.artifactsVersion}`);
    console.log(`     Resources: ${workloadConfig.cpus} CPUs, ${workloadConfig.memory} MB RAM, ${workloadConfig.disk} GB disk`);
    console.log(`     Public Port: ${workloadConfig.publicContainerPort}\n`);

    // Save configuration for later use
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, 'secretsigner-workload-config.json');
    fs.writeFileSync(configPath, JSON.stringify(workloadConfig, null, 2));
    console.log(`  💾 Configuration saved to: ${configPath}\n`);

    console.log('[4] Ready to create workload');
    console.log('  ⚠️  Before creating, ensure:');
    console.log('     - SecretSigner Docker image is available');
    console.log('     - Zcash spending key is generated');
    console.log('     - SecretSigner service is implemented\n');

    // Uncomment to actually create (once SecretSigner image is ready):
    /*
    console.log('[5] Creating workload...');
    const workload = await workloadClient.createWorkload(workloadConfig);
    console.log('  ✅ Workload created!');
    console.log(`  ID: ${workload.id}`);
    console.log(`  URL: ${workload.publicUrl || 'N/A'}`);
    console.log(`  Status: ${workload.status}\n`);

    // Save workload info
    const workloadInfoPath = path.join(__dirname, 'secretsigner-workload-info.json');
    fs.writeFileSync(workloadInfoPath, JSON.stringify({
      id: workload.id,
      url: workload.publicUrl,
      status: workload.status,
      createdAt: new Date().toISOString(),
    }, null, 2));
    console.log(`  💾 Workload info saved to: ${workloadInfoPath}\n`);
    */

    console.log('[5] Summary:');
    console.log('  ✅ Workload configuration ready');
    console.log('  ✅ Configuration file saved');
    console.log('  ⏳ Waiting for:');
    console.log('     - SecretSigner Docker image');
    console.log('     - Zcash spending key (from zallet)');
    console.log('     - Actual SecretSigner service implementation\n');

    console.log('Next Steps:');
    console.log('1. Generate Zcash keys (resolve zallet RPC limitations)');
    console.log('2. Build/create SecretSigner Docker image');
    console.log('3. Update workload config with actual image and key');
    console.log('4. Run this script again to create the workload');
    console.log('5. Test SecretSigner service endpoints');
    console.log('======================================\n');

  } catch (error: any) {
    console.error('\n❌ Failed to create workload:', error.message);
    logger.error('Workload creation failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run
createSecretSignerWorkload().catch(console.error);

