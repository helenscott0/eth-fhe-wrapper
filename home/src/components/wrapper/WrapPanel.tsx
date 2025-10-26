import { useState } from 'react';
import { Contract } from 'ethers';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contracts';

export function WrapPanel() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [amountEth, setAmountEth] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState<string>('');

  const onWrap = async () => {
    try {
      setBusy(true);
      setHash('');
      if (!address || !signerPromise) throw new Error('Wallet not connected');
      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const wei = BigInt(Math.floor(parseFloat(amountEth || '0') * 1e18));
      if (wei <= 0n) throw new Error('Invalid amount');
      const tx = await contract.wrapEth(address, { value: wei });
      setHash(tx.hash);
      await tx.wait();
    } catch (e:any) {
      alert(e.message || 'Wrap failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Wrap ETH to cETH</h2>
      <div className="field">
        <label>Amount (ETH)</label>
        <input type="number" min="0" step="0.000000000000000001" value={amountEth}
               onChange={(e) => setAmountEth(e.target.value)} placeholder="0.0" />
      </div>
      <button disabled={busy} onClick={onWrap}>{busy ? 'Wrapping...' : 'Wrap'}</button>
      {hash && <p className="hash">tx: {hash}</p>}
    </div>
  );
}

