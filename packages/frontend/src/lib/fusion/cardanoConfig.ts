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
        scriptHash: "fd031f12a6cf083eba41102e3b70765a98d815f80cdb800704ca25a9",
        scriptAddress: "addr_test1wr7sx8cj5m8ss046gygzuwmswedf3kq4lqxdhqq8qn9zt2g8lqjr0",
        validator: "source_escrow.source_escrow.spend",
        deployedAt: "2025-08-03T07:16:43.270Z",
        testedAt: "2025-08-03T07:09:11.898Z",
        status: "setup_verified"
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