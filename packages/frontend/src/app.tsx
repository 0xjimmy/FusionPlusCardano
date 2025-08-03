import { useSignal } from '@preact/signals'
import { wallet, connectWallet } from './swap/lucid'
import { getQuote, type QuoteResult } from './swap/getQuote'
import { executeSwap } from './swap/executeSwap'
import { parseUnits, formatUnits } from 'viem'
import './app.css'

export function App() {
  const adaAmount = useSignal('100')
  const sepoliaAddress = useSignal('0x0000000000000000000000000000000000001337')
  const isLoading = useSignal(false)
  const quote = useSignal<any>(null)
  const quoteResult = useSignal<QuoteResult | null>(null)

  const handleFetchQuote = async () => {
    if (!adaAmount.value || parseFloat(adaAmount.value) <= 0) {
      alert('Please enter a valid ADA amount')
      return
    }
    if (!sepoliaAddress.value) {
      alert('Please enter a Sepolia address')
      return
    }
    if (!wallet.value) {
      alert('Please connect your Cardano wallet first')
      return
    }
    
    isLoading.value = true
    try {
      console.log('Fetching quote for:', adaAmount.value, 'ADA to', sepoliaAddress.value)
      
      // Get quote using the new function
      const result = await getQuote(adaAmount.value, wallet.value, sepoliaAddress.value)
      quoteResult.value = result
      
      // Update the display quote with mock ETH amount for now
      // Convert ADA amount to ETH using mock rate (0.85 ADA = 1 ETH)
      const adaAmountInLovelace = parseUnits(adaAmount.value, 6) // ADA has 6 decimals
      const mockEthAmount = formatUnits(adaAmountInLovelace * BigInt(85) / BigInt(100), 18) // ETH has 18 decimals
      
      quote.value = { 
        amount: adaAmount.value, 
        address: sepoliaAddress.value,
        ethAmount: mockEthAmount
      }
      
      console.log('Quote result stored:', result)
    } catch (error) {
      console.error('Error fetching quote:', error)
      alert('Error fetching quote. Check console for details.')
    } finally {
      isLoading.value = false
    }
  }

  const handleCreateSwap = async () => {
    const lucid = wallet.value
    if (!lucid) return alert("Please connect Cardano Wallet")
    if (!quoteResult.value) return alert('Please fetch a quote first')
    
    isLoading.value = true
    try {
      // Use the new executeSwap function with the stored quote result
      const result = await executeSwap(adaAmount.value, lucid, quoteResult.value)
      console.log('ADA to ETH swap completed:', result)
      alert('Swap created successfully! Check console for details.')
    } catch (error) {
      console.error('Error creating swap:', error)
      alert('Error creating swap. Check console for details.')
    } finally {
      isLoading.value = false
    }
  }

  return (
    <>
      {/* Background Grid Pattern */}
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 50px 50px; pointer-events: none; z-index: 1;"></div>
      
      {/* Geometric Overlays */}
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2;">
        <div style="position: absolute; top: 10%; right: 15%; width: 200px; height: 200px; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; opacity: 0.3;"></div>
        <div style="position: absolute; bottom: 20%; left: 10%; width: 150px; height: 150px; background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);"></div>
        <div style="position: absolute; top: 50%; left: 5%; width: 100px; height: 2px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);"></div>
      </div>

      <div style="position: relative; z-index: 10; padding: 40px 20px;">
        {/* Header */}
        <div style="text-align: center; margin-bottom: 60px;">
          <h1 style="font-size: 4rem; font-weight: 800; color: #FFFFFF; margin: 0 0 16px 0; letter-spacing: -0.02em;">
            Cardano <span style="color: #9CA3AF;">Fusion</span>++
          </h1>
          <p style="color: #9CA3AF; font-size: 1.2rem; margin: 0; font-weight: 400;">
            /// POWERED BY 1INCH FUSION+.
          </p>
        </div>

        {/* Main Content */}
        <div style="max-width: 800px; margin: 0 auto;">
          
          {/* Step 1: Connect Wallet */}
          <div style="margin-bottom: 40px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 600; margin-right: 16px; font-size: 1.1rem;">01</div>
              <h3 style="margin: 0; color: #FFFFFF; font-size: 1.5rem; font-weight: 600;">CONNECT WALLET</h3>
            </div>
            <button 
              onClick={connectWallet}
              style="width: 100%; padding: 20px; background: transparent; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: 500; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px;"
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            >
              {wallet.value ? '✅ WALLET CONNECTED' : '🔗 CONNECT CARDANO WALLET'}
            </button>
          </div>

          {/* Step 2: Create Swap */}
          <div style="margin-bottom: 40px;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 600; margin-right: 16px; font-size: 1.1rem;">02</div>
              <h3 style="margin: 0; color: #FFFFFF; font-size: 1.5rem; font-weight: 600;">CREATE SWAP</h3>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 24px;">
              <div>
                <label style="display: block; margin-bottom: 12px; color: #9CA3AF; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.9rem;">ADA AMOUNT</label>
                <div style="position: relative;">
                  <input
                    type="number"
                    value={adaAmount.value}
                    onInput={(e) => adaAmount.value = (e.target as HTMLInputElement).value}
                    placeholder="0.0"
                    style="width: 100%; padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; font-size: 1.1rem; box-sizing: border-box; transition: all 0.3s; color: #FFFFFF; font-weight: 500;"
                    min="0"
                    step="0.1"
                    onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                  />
                  <span style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #9CA3AF; font-weight: 600; font-size: 1rem;">ADA</span>
                </div>
              </div>
              
              <div>
                <label style="display: block; margin-bottom: 12px; color: #9CA3AF; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.9rem;">SEPOLIA ADDRESS</label>
                <input
                  type="text"
                  value={sepoliaAddress.value}
                  onInput={(e) => sepoliaAddress.value = (e.target as HTMLInputElement).value}
                  placeholder="0x..."
                  style="width: 100%; padding: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; font-size: 1.1rem; box-sizing: border-box; transition: all 0.3s; color: #FFFFFF; font-weight: 500;"
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                />
              </div>

              <button 
                onClick={handleFetchQuote}
                disabled={isLoading.value}
                style="width: 100%; padding: 20px; background: transparent; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: 500; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px; opacity: 1;"
                onMouseOver={(e) => !isLoading.value && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)')}
                onMouseOut={(e) => !isLoading.value && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
              >
                {isLoading.value ? '⏳ FETCHING QUOTE...' : '💱 GET QUOTE'}
              </button>
            </div>
          </div>

          {/* Quote Summary */}
          {quote.value && (
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.2); border-radius: 16px; padding: 32px; margin-bottom: 32px;">
              <h4 style="margin: 0 0 24px 0; color: #FFFFFF; font-size: 1.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">QUOTE SUMMARY</h4>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #9CA3AF; font-weight: 500;">You send:</span>
                <span style="font-weight: 600; color: #FFFFFF; font-size: 1.1rem;">{quote.value.amount} ADA</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #9CA3AF; font-weight: 500;">You receive:</span>
                <span style="font-weight: 600; color: #FFFFFF; font-size: 1.1rem;">{quote.value.ethAmount} ETH</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 24px; padding: 12px 0;">
                <span style="color: #9CA3AF; font-weight: 500;">To address:</span>
                <span style="font-weight: 600; color: #FFFFFF; font-size: 0.9rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">{quote.value.address}</span>
              </div>
              <button 
                onClick={handleCreateSwap}
                disabled={isLoading.value}
                style="width: 100%; padding: 20px; background: transparent; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; cursor: pointer; font-size: 1.1rem; font-weight: 500; transition: all 0.3s; text-transform: uppercase; letter-spacing: 0.5px;"
                onMouseOver={(e) => !isLoading.value && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)')}
                onMouseOut={(e) => !isLoading.value && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
              >
                {isLoading.value ? '⏳ CREATING SWAP...' : '🚀 EXECUTE SWAP'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}