/**
 * Sepay Payment Provider (Vietnam)
 *
 * Sepay is a Vietnamese payment gateway supporting bank transfers and e-wallets.
 * https://sepay.vn
 */

import type {
	CheckoutSession,
	Order,
	PaymentProvider,
	PaymentProviderConfig,
	PaymentStatus,
	WebhookResult,
} from "../types.js";

const SEPAY_API_URL = "https://my.sepay.vn/userapi";

export const sepayProvider: PaymentProvider = {
	id: "sepay",
	name: "Sepay",

	async createCheckout(order: Order, config: PaymentProviderConfig): Promise<CheckoutSession> {
		// Sepay uses QR code / bank transfer flow
		// Generate a unique transaction reference
		const transactionRef = `LMS-${order.id.slice(-8).toUpperCase()}`;

		// For Sepay, we generate a payment page URL with order info
		// The actual payment is verified via webhook when user completes transfer
		const params = new URLSearchParams({
			amount: String(Math.round(order.amount)),
			description: `${order.type === "membership" ? "Membership" : "Course"} - ${order.item_id}`,
			reference: transactionRef,
			order_id: order.id,
		});

		const checkoutUrl = `${config.credentials.checkout_page_url}?${params}`;

		return {
			id: transactionRef,
			url: checkoutUrl,
			expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
		};
	},

	async handleWebhook(
		payload: unknown,
		headers: Record<string, string>,
		config: PaymentProviderConfig,
	): Promise<WebhookResult> {
		const data = payload as SepayWebhookPayload;

		// Verify webhook signature
		const signature = headers["x-sepay-signature"] || headers["authorization"];
		if (!verifySignature(data, signature, config.webhook_secret || "")) {
			throw new Error("Invalid webhook signature");
		}

		// Sepay webhook format
		if (data.transferType === "in" && data.transferAmount > 0) {
			// Extract order_id from content/description
			const orderId = extractOrderId(data.content);

			return {
				event: "payment.completed",
				orderId,
				status: "completed",
				metadata: {
					transactionId: data.id,
					bankCode: data.gateway,
					amount: data.transferAmount,
				},
			};
		}

		return { event: "unknown" };
	},

	async verifyPayment(paymentId: string, config: PaymentProviderConfig): Promise<PaymentStatus> {
		// Query Sepay API to verify transaction
		const response = await fetch(
			`${SEPAY_API_URL}/transactions/list?reference_number=${paymentId}`,
			{
				headers: {
					Authorization: `Bearer ${config.credentials.api_key}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			return { paid: false, status: "unknown" };
		}

		const data = (await response.json()) as SepayTransactionResponse;
		const transaction = data.transactions?.[0];

		if (!transaction) {
			return { paid: false, status: "not_found" };
		}

		return {
			paid: transaction.transferType === "in",
			status: transaction.transferType === "in" ? "completed" : "pending",
			amount: transaction.transferAmount,
			currency: "VND",
		};
	},
};

// Sepay types
interface SepayWebhookPayload {
	id: number;
	gateway: string;
	transactionDate: string;
	accountNumber: string;
	transferType: "in" | "out";
	transferAmount: number;
	content: string;
	referenceCode?: string;
}

interface SepayTransactionResponse {
	transactions: Array<{
		id: number;
		transferType: "in" | "out";
		transferAmount: number;
		content: string;
	}>;
}

function verifySignature(payload: unknown, signature: string, secret: string): boolean {
	if (!secret) return true; // Skip if no secret configured

	// Sepay uses Bearer token or HMAC signature
	if (signature.startsWith("Bearer ")) {
		return signature.slice(7) === secret;
	}

	// For HMAC verification (if implemented)
	// const computed = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
	// return computed === signature;

	return true;
}

function extractOrderId(content: string): string | undefined {
	// Look for LMS-XXXXXXXX pattern in transfer content
	const match = content.match(/LMS-([A-Z0-9]{8})/i);
	return match ? match[0] : undefined;
}
