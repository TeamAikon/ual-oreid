// import { Ledger } from 'ual-ledger'
// import { Lynx } from 'ual-lynx'
// import { Scatter } from 'ual-scatter'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

import { JsonRpc } from 'eosjs'
import * as React from 'react'
import { OreIdAuthenticator, AuthProvider } from 'ual-oreid'
import { WebPopup } from 'oreid-webpopup'
import './App.css'

interface Network {
  CHAIN_ID: string
  RPC_PROTOCOL: string
  RPC_HOST: string
  RPC_PORT: string
}

const TELOS_TEST: Network = {
  CHAIN_ID: '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
  RPC_PROTOCOL: 'https',
  RPC_HOST: 'testnet.telos.caleos.io',
  RPC_PORT: '443'
}

const telosTestNet = {
  chainId: TELOS_TEST.CHAIN_ID,
  rpcEndpoints: [
    {
      protocol: TELOS_TEST.RPC_PROTOCOL,
      host: TELOS_TEST.RPC_HOST,
      port: Number(TELOS_TEST.RPC_PORT)
    }
  ]
}

const tlosTransferTransaction = {
  actions: [
    {
      account: 'eosio.token',
      name: 'transfer',
      authorization: [
        {
          actor: '', // use account that was logged in
          permission: 'active'
        }
      ],
      data: {
        from: '', // use account that was logged in
        to: 'ore1trgeahoo',
        quantity: '0.0005 TLOS',
        memo: 'UAL rocks!'
      }
    }
  ]
}

const TransactionApp = ({ ual }: any) => {
  const { activeUser } = ual;
  const [activeUserState, setActiveUserState] = React.useState(null);
  const [accountName, setAccountName] = React.useState('');
  const [accountBalance, setAccountBalance] = React.useState(null);
  const rpc: JsonRpc = new JsonRpc(
    `${TELOS_TEST.RPC_PROTOCOL}://${TELOS_TEST.RPC_HOST}:${TELOS_TEST.RPC_PORT}`,
    { fetch }
  );

  React.useEffect(() => {
    // If we have an active user, and we didn't before, update state
    if (activeUser && !activeUserState) {
      setActiveUserState(activeUser);
      updateAccountName();
    }

    // If we don't have an active user, but we did before, clear state
    if (!activeUser && activeUserState) {    
      setActiveUserState(null);
      setAccountName('');
      setAccountBalance(null);
    }
  }, [activeUser, activeUserState]);

  const updateAccountName = async () => {
    try {
      const accountName = await activeUser.getAccountName();
      setAccountName(accountName);
      updateAccountBalance();
      
    } catch (e) {
      console.warn(e)
    }
  }

  const updateAccountBalance = async () => {
    try {
      const account = await rpc.get_account(activeUser.accountName);
      const accountBalance: any = account.core_liquid_balance;
      setAccountBalance(accountBalance);
    } catch (e) {
      console.warn(e)
    }
  }

  const transfer = async () => {
    tlosTransferTransaction.actions[0].authorization[0].actor = accountName;
    tlosTransferTransaction.actions[0].data.from = accountName;
    try {
      await activeUser.signTransaction(tlosTransferTransaction, { broadcast: true });

      setTimeout(() => {
        updateAccountBalance()
      }, 1000)
    } catch (error) {
      console.warn(error)
    }
  }

  const renderModalButton = () => {
    return (
      <p className='ual-btn-wrapper'>
        <span
          role='button'
          onClick={ual.showModal}
          className='ual-generic-button'
        >
          Show UAL Modal
        </span>
      </p>
    )
  }

  const renderTransferButton = () => {
    return (
      <p className='ual-btn-wrapper'>
        <span className='ual-generic-button blue' onClick={transfer}>
          {'0.0005 EOS'}
        </span>
      </p>
    )
  };

  const renderLogoutBtn = () => {
    const { activeAuthenticator, logout } = ual;
    if (!!activeUser && !!activeAuthenticator) {
      return (
        <p className='ual-btn-wrapper'>
          <span className='ual-generic-button red' onClick={logout}>
            {'Logout'}
          </span>
        </p>
      )
    }
  }

  const modalButton = !activeUser && renderModalButton();
  const loggedIn = accountName ? `Logged in as ${accountName}` : '';
  const myBalance = accountBalance ? `Balance: ${accountBalance}` : '';
  const transferBtn = accountBalance && renderTransferButton();

  return (
    <div style={{ textAlign: 'center' }}>
      {modalButton}
      <h3 className='ual-subtitle'>{loggedIn}</h3>
      <h4 className='ual-subtitle'>{myBalance}</h4>
      {transferBtn}
      {renderLogoutBtn()}
    </div>
  )
}

const TestAppConsumer = withUAL(TransactionApp)

TestAppConsumer.displayName = 'TestAppConsumer'

const oreid = new OreIdAuthenticator(
  [telosTestNet],
  {
    appId: 't_372177f5e8194e23afe7f145191c8ee7',
    plugins: { popup: WebPopup() }
  },
  AuthProvider.Google
)

export default () => {
  return (
    <UALProvider
      chains={[telosTestNet]}
      authenticators={[oreid]}
      appName={'My App'}
    >
      <TestAppConsumer />
    </UALProvider>
  )
}