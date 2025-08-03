// Configuration for Cardano deployments
// This loads the deployment references from the aiken-resolver JSON config files

export interface CardanoDeploymentConfig {
  network: string;
  scriptHash: string;
  scriptAddress: string;
  validator: string;
  deployedAt?: string;
  testedAt?: string;
  status?: string;
}

// Load deployment configurations
const loadDeploymentConfig = (network: string): CardanoDeploymentConfig => {
  try {
    // In a real implementation, you would load these from the actual JSON files
    // For now, we'll use the values from the deployment files
    if (network === "preview") {
      return {
        network: "preview",
        scriptHash: "986a4a642800db0851382bfc34934714d0022503834edc99dbff94c0",
        scriptAddress: "addr_test1wzvx5jny9qqdkzz38q4lcdyngu2dqq39qwp5ahyem0lefsqjd870e",
        validator: "source_escrow.source_escrow.spend",
        deployedAt: "2025-01-27T12:00:00.000Z",
        testedAt: "2025-01-27T12:00:00.000Z",
        status: "deployed"
      };
    } else if (network === "mainnet") {
      // Add mainnet configuration when available
      return {
        network: "mainnet",
        scriptHash: "", // To be filled when mainnet deployment is available
        scriptAddress: "", // To be filled when mainnet deployment is available
        validator: "source_escrow.source_escrow.spend"
      };
    }
    
    throw new Error(`Unsupported network: ${network}`);
  } catch (error) {
    console.error(`Failed to load deployment config for network ${network}:`, error);
    throw new Error(`Failed to load deployment config: ${error}`);
  }
};

// Network configurations
export const NETWORK_CONFIGS = {
  preview: {
    network: "preview" as const,
    apiUrl: "https://preview.koios.rest/api/v1",
    deployment: loadDeploymentConfig("preview")
  },
  mainnet: {
    network: "mainnet" as const,
    apiUrl: "https://api.koios.rest/api/v1",
    deployment: loadDeploymentConfig("mainnet")
  }
};

// Helper function to get deployment config
export function getDeploymentConfig(network: "preview" | "mainnet"): CardanoDeploymentConfig {
  return NETWORK_CONFIGS[network].deployment;
}

// Helper function to validate deployment config
export function validateDeploymentConfig(config: CardanoDeploymentConfig): boolean {
  return !!(
    config.network &&
    config.scriptHash &&
    config.scriptAddress &&
    config.validator
  );
}

// Export the configuration for use in other modules
export default NETWORK_CONFIGS; 