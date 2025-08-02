use aiken/builtin.{keccak_256}
use cardano/transaction.{OutputReference, Transaction}
use vodka_extra_signatories.{key_signed}
use vodka_validity_range.{valid_after}
use aiken/crypto.{VerificationKeyHash}

// Datum structure for the atomic swap
pub type SwapDatum {
  expire_timestamp: Int,
  maker_address: VerificationKeyHash,
  taker_address: VerificationKeyHash,
  secret_hash: ByteArray,
}

// Redeemer for spending the swap UTXO
pub type SwapRedeemer {
  // For maker: no secret needed, just claim after expiry
  MakerClaim
  // For taker: must provide secret that hashes to secret_hash
  TakerClaim { secret: ByteArray }
}

validator source_escrow {
  // In principle, scripts can be used for different purpose (e.g. minting
  // assets). Here we make sure it's only used when 'spending' from a eUTxO
  spend(
    datum_opt: Option<SwapDatum>,
    redeemer: SwapRedeemer,
    _input: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum_opt
    
    when redeemer is {
      // Maker can claim after expiry timestamp
      MakerClaim -> {
        // Check if current time >= expire_timestamp using vodka
        let expired = valid_after(tx.validity_range, datum.expire_timestamp)
        
        // Check that maker has signed the transaction
        let maker_signed = key_signed(tx.extra_signatories, datum.maker_address)
        
        expired && maker_signed
      }
      
      // Taker can claim before expiry with correct secret
      TakerClaim { secret } -> {
        // Check if current time < expire_timestamp (not expired yet)
        let not_expired = !valid_after(tx.validity_range, datum.expire_timestamp)
        
        // Verify secret hashes to stored hash using Keccak256
        let secret_valid = keccak_256(secret) == datum.secret_hash
        
        // Check that taker has signed the transaction
        let taker_signed = key_signed(tx.extra_signatories, datum.taker_address)
        
        not_expired && secret_valid && taker_signed
      }
    }
  }

  else(_) {
    fail
  }
}