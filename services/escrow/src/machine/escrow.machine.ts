import { assign, createMachine } from "xstate";
import type { EscrowStatus } from "@kunda/types";

export type EscrowContext = {
  escrowId: string;
  listingId: string;
  buyerId: string;
  amountGBP: number;
  platformFee: number;
  stripePaymentId?: string;
  disputeReason?: string;
  note?: string;
};

export type EscrowEvent =
  | { type: "FUND"; stripePaymentId: string }
  | { type: "VERIFY_TITLE"; note?: string }
  | { type: "SIGN_DOCS"; note?: string }
  | { type: "COMPLETE"; note?: string }
  | { type: "DISPUTE"; reason: string }
  | { type: "REFUND"; note?: string }
  | { type: "RESOLVE_DISPUTE"; note?: string };

export function createEscrowMachine(initialState: EscrowStatus = "INITIATED") {
  return createMachine({
    id: "escrow",
    initial: initialState,
    types: {} as {
      context: EscrowContext;
      events: EscrowEvent;
      input: EscrowContext;
    },
    context: ({ input }) => input,
    states: {
      INITIATED: {
        on: {
          FUND: {
            target: "FUNDED",
            actions: assign({
              stripePaymentId: ({ event }) => event.stripePaymentId,
            }),
          },
          REFUND: { target: "REFUNDED" },
        },
      },
      FUNDED: {
        on: {
          VERIFY_TITLE: { target: "TITLE_VERIFIED" },
          DISPUTE: {
            target: "DISPUTED",
            actions: assign({
              disputeReason: ({ event }) => event.reason,
            }),
          },
          REFUND: { target: "REFUNDED" },
        },
      },
      TITLE_VERIFIED: {
        on: {
          SIGN_DOCS: { target: "DOCS_SIGNED" },
          DISPUTE: {
            target: "DISPUTED",
            actions: assign({
              disputeReason: ({ event }) => event.reason,
            }),
          },
          REFUND: { target: "REFUNDED" },
        },
      },
      DOCS_SIGNED: {
        on: {
          COMPLETE: { target: "COMPLETED" },
          DISPUTE: {
            target: "DISPUTED",
            actions: assign({
              disputeReason: ({ event }) => event.reason,
            }),
          },
        },
      },
      COMPLETED: {
        type: "final",
      },
      DISPUTED: {
        on: {
          RESOLVE_DISPUTE: { target: "REFUNDED" },
          COMPLETE: { target: "COMPLETED" },
        },
      },
      REFUNDED: {
        type: "final",
      },
    },
  });
}

export const escrowMachine = createEscrowMachine();
