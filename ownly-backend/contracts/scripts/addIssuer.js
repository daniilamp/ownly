const { ethers } = require('hardhat');
const fs = require('fs');

async function main() {
  const deployments = JSON.parse(fs.readFileSync('./deployments.json', 'utf8'));
  const batchProcessorAddress = deployments.contracts.BatchProcessor;
  
  console.log('Adding issuer to BatchProcessor...');
  console.log('Contract:', batchProcessorAddress);
  
  const BatchProcessor = await ethers.getContractAt('BatchProcessor', batchProcessorAddress);
  
  // Your wallet address
  const issuerAddress = '0xEeb9a177FD70e442EcAca1A6b968cCfC2baE7Ec0';
  
  console.log('Issuer address:', issuerAddress);
  
  // Check if already authorized
  const isAuthorized = await BatchProcessor.isIssuer(issuerAddress);
  if (isAuthorized) {
    console.log('✅ Already authorized as issuer!');
    return;
  }
  
  // Add issuer
  console.log('Adding issuer...');
  const tx = await BatchProcessor.addIssuer(issuerAddress);
  console.log('Transaction hash:', tx.hash);
  
  await tx.wait();
  console.log('✅ Issuer added successfully!');
  
  // Verify
  const isNowAuthorized = await BatchProcessor.isIssuer(issuerAddress);
  console.log('Verification:', isNowAuthorized ? '✅ Authorized' : '❌ Not authorized');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
