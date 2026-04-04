/**
 * Payment Providers Registry
 */

import type { PaymentProvider, PaymentProviderConfig } from "../types.js";
import { sepayProvider } from "./sepay.js";
import { stripeProvider } from "./stripe.js";

// Registry of available providers
const providers: Record<string, PaymentProvider> = {
	stripe: stripeProvider,
	sepay: sepayProvider,
};

/**
 * Get payment provider by ID
 */
export function getProvider(id: string): PaymentProvider | undefined {
	return providers[id];
}

/**
 * Get all available providers
 */
export function getAllProviders(): PaymentProvider[] {
	return Object.values(providers);
}

/**
 * Register a custom payment provider
 */
export function registerProvider(provider: PaymentProvider): void {
	providers[provider.id] = provider;
}

/**
 * Get enabled providers from settings
 */
export function getEnabledProviders(configs: PaymentProviderConfig[]): PaymentProvider[] {
	return configs
		.filter((c) => c.enabled)
		.map((c) => providers[c.id])
		.filter((p): p is PaymentProvider => p !== undefined);
}

export { sepayProvider, stripeProvider };
