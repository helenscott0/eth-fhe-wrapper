import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WrapPanel } from './wrapper/WrapPanel';
import { UnwrapPanel } from './wrapper/UnwrapPanel';
import { BalancePanel } from './wrapper/BalancePanel';
import '../styles/Wrapper.css';

export function WrapperApp() {
  const [activeTab, setActiveTab] = useState<'wrap' | 'unwrap' | 'balance'>('wrap');

  return (
    <div className="wrapper-app">
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">cETH Wrapper</h1>
            </div>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="tab-navigation">
          <nav className="tab-nav">
            <button onClick={() => setActiveTab('wrap')} className={`tab-button ${activeTab === 'wrap' ? 'active' : 'inactive'}`}>
              Wrap ETH → cETH
            </button>
            <button onClick={() => setActiveTab('unwrap')} className={`tab-button ${activeTab === 'unwrap' ? 'active' : 'inactive'}`}>
              Unwrap cETH → ETH
            </button>
            <button onClick={() => setActiveTab('balance')} className={`tab-button ${activeTab === 'balance' ? 'active' : 'inactive'}`}>
              Balance & Decrypt
            </button>
          </nav>
        </div>

        {activeTab === 'wrap' && <WrapPanel />}
        {activeTab === 'unwrap' && <UnwrapPanel />}
        {activeTab === 'balance' && <BalancePanel />}
      </main>
    </div>
  );
}

