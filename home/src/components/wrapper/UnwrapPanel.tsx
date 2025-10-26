import { useState } from 'react';
import { Contract } from 'ethers';
import { useAccount } from 'wagmi';
import { useEthersSigner } from '../../hooks/useEthersSigner';
import { useZamaInstance } from '../../hooks/useZamaInstance';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../config/contracts';

export function UnwrapPanel() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading } = useZamaInstance();
  const [units, setUnits] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [hash, setHash] = useState<string>('');

  const onUnwrap = async () => {
    try {
      setBusy(true);
      setHash('');
      if (!address || !signerPromise || !instance) throw new Error('Wallet or encryption not ready');
      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const v = parseInt(units || '0');
      if (!Number.isFinite(v) || v <= 0) throw new Error('Invalid units');

      const encrypted = await instance
        .createEncryptedInput(CONTRACT_ADDRESS, address)
        .add64(v)
        .encrypt();

      const tx = await contract.requestUnwrapToEth(
        address,
        address,
        encrypted.handles[0],
        encrypted.inputProof
      );
      setHash(tx.hash);
      await tx.wait();
      alert('Unwrap requested. ETH will be sent after decryption finalizes.');
    } catch (e:any) {
      alert(e.message || 'Unwrap failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h2>Unwrap cETH to ETH</h2>
      <div className="field">
        <label>cETH Units</label>
        <input type="number" min="0" step="1" value={units}
               onChange={(e) => setUnits(e.target.value)} placeholder="0" />
      </div>
      <button disabled={busy || isLoading} onClick={onUnwrap}>{busy ? 'Requesting...' : 'Request Unwrap'}</button>
      {hash && <p className="hash">tx: {hash}</p>}
    </div>
  );
}

