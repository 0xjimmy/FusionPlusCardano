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
    trace @"source_escrow_spend": @"start"
    
    expect Some(datum) = datum_opt
    
    trace @"datum_parsed": datum.expire_timestamp, datum.maker_address, datum.taker_address, datum.secret_hash
    
    when redeemer is {
      // Maker can claim after expiry timestamp
      MakerClaim -> {
        trace @"redeemer": @"MakerClaim"
        
        // Check if current time >= expire_timestamp using vodka
        let expired = valid_after(tx.validity_range, datum.expire_timestamp)
        trace @"time_check": @"expired", expired, tx.validity_range, datum.expire_timestamp
        
        // Check that maker has signed the transaction
        let maker_signed = key_signed(tx.extra_signatories, datum.maker_address)
        trace @"signature_check": @"maker_signed", maker_signed, tx.extra_signatories, datum.maker_address
        
        let result = expired && maker_signed
        trace @"maker_claim_result": result
        
        result
      }
      
      // Taker can claim before expiry with correct secret
      TakerClaim { secret } -> {
        trace @"redeemer": @"TakerClaim", secret
        
        // Check if current time < expire_timestamp (not expired yet)
        let not_expired = !valid_after(tx.validity_range, datum.expire_timestamp)
        trace @"time_check": @"not_expired", not_expired, tx.validity_range, datum.expire_timestamp
        
        // Verify secret hashes to stored hash using Keccak256
        let secret_hash = keccak_256(secret)
        trace @"secret_validation": @"calculated_hash", secret_hash, @"stored_hash", datum.secret_hash
        let secret_valid = secret_hash == datum.secret_hash
        trace @"secret_validation": @"secret_valid", secret_valid
        
        // Check that taker has signed the transaction
        let taker_signed = key_signed(tx.extra_signatories, datum.taker_address)
        trace @"signature_check": @"taker_signed", taker_signed, tx.extra_signatories, datum.taker_address
        
        let result = not_expired && secret_valid && taker_signed
        trace @"taker_claim_result": result, not_expired, secret_valid, taker_signed
        
        result
      }
    }
  }

  else(_) {
    trace @"source_escrow_spend": @"fail_else"
    fail
  }
}