/**
 * Stripe Payment Provider
 */

import type {
	CheckoutSession,
	Order,
	PaymentProvider,
	PaymentProviderConfig,
	PaymentStatus,
	WebhookResult,
} from "../types.js";

export const stripeProvider: PaymentProvider = {
	id: "stripe",
	name: "Stripe",

	async createCheckout(order: Order, config: PaymentProviderConfig): Promise<CheckoutSession> {
		const stripe = await getStripe(config);

		const lineItems = [
			{
				price_data: {
					currency: order.currency.toLowerCase(),
					product_data: {
						name: order.type === "membership" ? "Membership Plan" : "Course",
						metadata: { item_id: order.item_id, type: order.type },
					},
					unit_amount: Math.round(order.amount * 100),
				},
				quantity: 1,
			},
		];

		const session = await stripe.checkout.sessions.create({
			mode: order.type === "membership" ? "subscription" : "payment",
			line_items: lineItems,
			success_url: `${config.credentials.success_url}?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: config.credentials.cancel_url,
			metadata: { order_id: order.id },
		});

		return {
			id: session.id,
			url: session.url!,
			expires_at: new Date(session.expires_at * 1000).toISOString(),
		};
	},

	async handleWebhook(
		payload: unknown,
		headers: Record<string, string>,
		config: PaymentProviderConfig,
	): Promise<WebhookResult> {
		const stripe = await getStripe(config);
		const sig = headers["stripe-signature"];

		if (!sig || !config.webhook_secret) {
			throw new Error("Missing signature or webhook secret");
		}

		const event = stripe.webhooks.constructEvent(
			payload as string | Buffer,
			sig,
			config.webhook_secret,
		);

		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object;
				return {
					event: "payment.completed",
					orderId: session.metadata?.order_id,
					status: "completed",
					subscriptionId: session.subscription as string | undefined,
				};
			}
			case "invoice.payment_failed": {
				const invoice = event.data.object;
				return {
					event: "payment.failed",
					subscriptionId: invoice.subscription as string | undefined,
					status: "failed",
				};
			}
			case "customer.subscription.deleted": {
				const subscription = event.data.object;
				return {
					event: "subscription.cancelled",
					subscriptionId: subscription.id,
					status: "cancelled" as unknown as undefined,
				};
			}
			default:
				return { event: event.type };
		}
	},

	async verifyPayment(paymentId: string, config: PaymentProviderConfig): Promise<PaymentStatus> {
		const stripe = await getStripe(config);
		const session = await stripe.checkout.sessions.retrieve(paymentId);

		return {
			paid: session.payment_status === "paid",
			status: session.payment_status,
			amount: session.amount_total ? session.amount_total / 100 : undefined,
			currency: session.currency?.toUpperCase(),
		};
	},

	async cancelSubscription(subscriptionId: string, config: PaymentProviderConfig): Promise<void> {
		const stripe = await getStripe(config);
		await stripe.subscriptions.cancel(subscriptionId);
	},
};

// Lazy load Stripe SDK
let stripeInstance: import("stripe").default | null = null;

async function getStripe(config: PaymentProviderConfig) {
	if (!stripeInstance) {
		const Stripe = (await import("stripe")).default;
		const secretKey = config.test_mode
			? config.credentials.test_secret_key
			: config.credentials.live_secret_key;
		stripeInstance = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
	}
	return stripeInstance;
}
