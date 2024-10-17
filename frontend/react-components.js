import React from 'react';
import ReactDOM from 'react-dom';
import WalletContextProvider from './components/WalletContextProvider';
import NavBar from './components/NavBar';
import BalanceDisplay from './components/BalanceDisplay';
import SendSolForm from './components/SendSolForm';

function SolTransferApp() {
  return (
    <WalletContextProvider>
      <NavBar />
      <BalanceDisplay />
      <SendSolForm />
    </WalletContextProvider>
  );
}

window.mountSolTransferApp = function(elementId) {
  const mountPoint = document.getElementById(elementId);
  if (mountPoint) {
    ReactDOM.render(<SolTransferApp />, mountPoint);
  }
};