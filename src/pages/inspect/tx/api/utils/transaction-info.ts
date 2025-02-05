import { FullViewingKey } from '@penumbra-zone/crypto/src/full-viewing-key';
import { Transaction } from '@penumbra-zone/types/src/transaction';
import { TransactionPerspective } from '@penumbra-zone/types/src/transaction-perspective';
import { TransactionView } from '@penumbra-zone/types/src/transaction-view';
import { DbConstants } from '@penumbra-zone/storage/src/db-constants';
import { Storage } from '@penumbra-zone/storage/src/storage';
import { Position } from '@penumbra-zone/types/src/position';
import { StateCommitment } from '@penumbra-zone/types/src/state-commitment';
import { Nullifier } from '@penumbra-zone/types/src/nullifier';
import { TransactionId } from '@penumbra-zone/types/src/transaction-id';
import { CommitmentSource } from '@penumbra-zone/types/src/commitment-source';
import { BatchSwapOutputData } from '@penumbra-zone/types/src/batch-swap-output-data';
import {
  ActionView,
  SpendView,
  OutputView,
  SwapView,
  SwapClaimView,
  DelegatorVoteView,
  ActionDutchAuctionScheduleView,
  ActionDutchAuctionWithdrawView,
} from '@penumbra-zone/types/src/action-view';

interface TxpAndTxvBytes {
  txp: Uint8Array;
  txv: Uint8Array;
}

/**
 * Get transaction perspective and transaction view
 * @param fullViewingKey FullViewingKey inner bytes
 * @param tx Binary-encoded Transaction message
 * @param idbConstants IndexedDbConstants
 * @returns {Promise<TxpAndTxvBytes>} Binary-encoded TransactionPerspective and TransactionView
 */
export async function transactionPerspectiveAndView(
  fullViewingKey: Uint8Array,
  tx: Uint8Array,
  idbConstants: DbConstants,
): Promise<TxpAndTxvBytes> {
  const transaction = Transaction.decode(tx);
  const fvk = FullViewingKey.decode(fullViewingKey);
  const [txp, txv] = await transactionInfoInner(fvk, transaction, idbConstants);

  return {
    txp: txp.encode(),
    txv: txv.encode(),
  };
}

async function transactionInfoInner(
  fvk: FullViewingKey,
  tx: Transaction,
  idbConstants: DbConstants,
): Promise<[TransactionPerspective, TransactionView]> {
  const storage = await Storage.init(idbConstants);

  // First, create a TxP with the payload keys visible to our FVK and no other data
  let txp = new TransactionPerspective({
    payloadKeys: tx.getPayloadKeys(fvk),
    transactionId: tx.id(),
  });

  // Next, extend the TxP with openings of commitments known to our view server
  for (const action of tx.actions) {
    switch (action.type) {
      case 'Spend': {
        const nullifier = action.body.nullifier;
        const spendableNoteRecord = await storage.getNoteByNullifier(nullifier);
        if (spendableNoteRecord) {
          txp.spendNullifiers.set(nullifier, spendableNoteRecord.note);
        }
        break;
      }
      case 'Swap': {
        const commitment = action.body.payload.commitment;
        const swapRecord = await storage.getSwapByCommitment(commitment);
        if (swapRecord) {
          // Add swap output to perspective
          if (swapRecord.outputData) {
            const bsod = BatchSwapOutputData.fromProto(swapRecord.outputData);
            txp.batchSwapOutputData.push(bsod);
          }

          // Add swap claim to perspective
          const swapPosition = Position.fromNumber(swapRecord.position);
          await addSwapClaimTxnToPerspective(storage, fvk, txp, commitment, swapPosition);
        }
        break;
      }
      case 'SwapClaim': {
        const nullifier = action.body.nullifier;
        const swapRecord = await storage.getSwapByNullifier(nullifier);

        if (swapRecord?.source) {
          const commitmentSource = CommitmentSource.fromProto(swapRecord.source);
          const id = commitmentSource.getId();
          if (id) {
            txp.creationTransactionIdsByNullifier.set(nullifier, new TransactionId(id));
          }
        }

        const output1Record = await storage.getNote(action.body.output1Commitment);
        if (!output1Record) {
          throw new Error('SwapClaim output 1 commitment not found');
        }

        const output2Record = await storage.getNote(action.body.output2Commitment);
        if (!output2Record) {
          throw new Error('SwapClaim output 2 commitment not found');
        }

        txp.adviceNotes.set(action.body.output1Commitment, output1Record.note);
        txp.adviceNotes.set(action.body.output2Commitment, output2Record.note);
        break;
      }
      case 'DelegatorVote': {
        const nullifier = action.body.nullifier;
        const spendableNoteRecord = await storage.getNoteByNullifier(nullifier);
        if (spendableNoteRecord) {
          txp.spendNullifiers.set(nullifier, spendableNoteRecord.note);
        }
        break;
      }
    }
  }

  // Generate stub TxV from minimal TxP and inspect for additional context
  const minView = tx.viewFromPerspective(txp);
  const addressViews = new Map();
  const assetIds = new Set();

  for (const actionView of minView.actionViews) {
    switch (actionView.type) {
      case 'Spend': {
        const view = actionView as SpendView;
        if (view.isVisible) {
          const note = view.note;
          addressViews.set(note.address.encode(), fvk.viewAddress(note.address));
          assetIds.add(note.assetId);
        }
        break;
      }
      case 'Output': {
        const view = actionView as OutputView;
        if (view.isVisible) {
          const note = view.note;
          addressViews.set(note.address.encode(), fvk.viewAddress(note.address));
          assetIds.add(note.assetId);

          const memo = tx.decryptMemo(fvk);
          addressViews.set(memo.returnAddress.encode(), fvk.viewAddress(note.address));
        }
        break;
      }
      case 'Swap': {
        const view = actionView as SwapView;
        if (view.isVisible) {
          const { swapPlaintext } = view;
          addressViews.set(
            swapPlaintext.claimAddress.encode(),
            fvk.viewAddress(swapPlaintext.claimAddress),
          );
          assetIds.add(swapPlaintext.tradingPair.asset1);
          assetIds.add(swapPlaintext.tradingPair.asset2);
        }
        break;
      }
      case 'SwapClaim': {
        const view = actionView as SwapClaimView;
        if (view.isVisible) {
          const { output1, output2 } = view;
          addressViews.set(output1.address.encode(), fvk.viewAddress(output1.address));
          assetIds.add(output1.assetId);
          assetIds.add(output2.assetId);
        }
        break;
      }
      case 'DelegatorVote': {
        const view = actionView as DelegatorVoteView;
        if (view.isVisible) {
          const { note } = view;
          addressViews.set(note.address.encode(), fvk.viewAddress(note.address));
          assetIds.add(note.assetId);
        }
        break;
      }
      case 'ActionDutchAuctionSchedule': {
        const view = actionView as ActionDutchAuctionScheduleView;
        const { action } = view;
        assetIds.add(action.description.outputId);
        assetIds.add(action.description.input.assetId);
        break;
      }
      case 'ActionDutchAuctionWithdraw': {
        const view = actionView as ActionDutchAuctionWithdrawView;
        view.reserves.forEach(reserve => {
          assetIds.add(reserve.assetId);
        });
        break;
      }
    }
  }

  // Extend TxP with helpful context information
  const denoms = [];
  for (const id of assetIds) {
    const denom = await storage.getAsset(id);
    if (denom) {
      denoms.push(denom);
    }
  }

  txp.denoms = denoms;
  txp.addressViews = Array.from(addressViews.values());

  // Compute full TxV from full TxP
  const txv = tx.viewFromPerspective(txp);

  return [txp, txv];
}

async function addSwapClaimTxnToPerspective(
  storage: Storage,
  fvk: FullViewingKey,
  txp: TransactionPerspective,
  commitment: StateCommitment,
  swapPosition: Position,
): Promise<void> {
  const derivedNullifierFromSwap = Nullifier.derive(fvk.nullifierKey, swapPosition, commitment);

  const transactionInfos = await storage.getTransactionInfos();

  for (const transactionInfo of transactionInfos) {
    if (!transactionInfo.transaction?.body) continue;

    for (const action of transactionInfo.transaction.body.actions) {
      if (action.type !== 'SwapClaim') continue;

      const nullifier = action.body.nullifier;
      if (nullifier.equals(derivedNullifierFromSwap)) {
        const transactionId = TransactionId.fromProto(transactionInfo.id);
        txp.nullificationTransactionIdsByCommitment.set(commitment, transactionId);
        break;
      }
    }
  }
}
