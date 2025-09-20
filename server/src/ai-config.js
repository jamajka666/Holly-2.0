import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let configCache = null;

/**
 * Load AI model configuration from JSON file
 */
export function loadAIConfig() {
  if (configCache) {
    return configCache;
  }

  try {
    const configPath = path.join(__dirname, "ai-models.config.json");
    const configData = fs.readFileSync(configPath, "utf-8");
    configCache = JSON.parse(configData);
    return configCache;
  } catch (error) {
    console.error("Failed to load AI configuration:", error);
    // Return default configuration if file load fails
    return getDefaultConfig();
  }
}

/**
 * Check if Claude Sonnet 4 is enabled for all clients
 */
export function isClaudeSonnet4EnabledForAllClients() {
  const config = loadAIConfig();
  return config.aiModels.claudeSonnet4.enabled && 
         config.aiModels.claudeSonnet4.enabledForAllClients === true &&
         config.clientAccess.globalSettings.enableClaudeSonnet4ForAll;
}

/**
 * Check if o4-mini is enabled for all clients
 */
export function isO4MiniEnabledForAllClients() {
  const config = loadAIConfig();
  return config.aiModels.o4mini && 
         config.aiModels.o4mini.enabled && 
         config.aiModels.o4mini.enabledForAllClients === true &&
         config.clientAccess.globalSettings.enableO4MiniForAll;
}

/**
 * Get the active AI model configuration for a client
 */
export function getActiveModelForClient(clientId) {
  const config = loadAIConfig();
  
  // If Claude Sonnet 4 is enabled for all clients, return it
  if (isClaudeSonnet4EnabledForAllClients()) {
    return config.aiModels.claudeSonnet4;
  }
  
  // Otherwise return the first available fallback model
  const fallbackModels = Object.values(config.aiModels.fallbackModels);
  const enabledFallback = fallbackModels.find(model => model.enabled);
  
  return enabledFallback || config.aiModels.claudeSonnet4;
}

/**
 * Update the configuration to enable/disable Claude Sonnet 4 for all clients
 */
export function updateClaudeSonnet4Access(enableForAll) {
  const config = loadAIConfig();
  
  config.aiModels.claudeSonnet4.enabledForAllClients = enableForAll;
  config.clientAccess.globalSettings.enableClaudeSonnet4ForAll = enableForAll;
  config.lastUpdated = new Date().toISOString();
  
  // Save configuration back to file
  const configPath = path.join(__dirname, "ai-models.config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  // Clear cache to reload updated config
  configCache = null;
  
  console.log(`Claude Sonnet 4 access for all clients: ${enableForAll ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Get default configuration if file is missing
 */
function getDefaultConfig() {
  return {
    aiModels: {
      claudeSonnet4: {
        enabled: true,
        enabledForAllClients: true,
        modelName: "claude-3-5-sonnet-20241022",
        description: "Claude Sonnet 4 - Latest Anthropic model",
        priority: 1
      },
      fallbackModels: {}
    },
    clientAccess: {
      globalSettings: {
        enableClaudeSonnet4ForAll: true,
        allowModelSelection: true,
        defaultModel: "claudeSonnet4"
      },
      restrictions: {
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 60,
          requestsPerHour: 1000
        }
      }
    },
    lastUpdated: new Date().toISOString(),
    version: "1.0.0"
  };
}

/**
 * Get current configuration status for logging/debugging
 */
export function getConfigStatus() {
  const config = loadAIConfig();
  return {
    claudeSonnet4Enabled: config.aiModels.claudeSonnet4.enabled,
    enabledForAllClients: isClaudeSonnet4EnabledForAllClients()
  };
}
