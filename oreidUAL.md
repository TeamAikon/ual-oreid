
# Universal Authenticator Library (UAL) for EOS Developers

## Introduction

The Universal Authenticator Library (UAL) is a collection of libraries and user interface components that make it easier for developers to integrate with multiple web3 (EOS) wallets, provide a seamless user experience for users and a simple plug n play auth interface for developers.

In this guide, we'll go over the steps to integrate UAL into a Telos dApp, so users can log in with their preferred wallet and interact with your dApp.

## Prerequisites

Before you start, you need to have the following:

-   An ORE-ID [developer account](https://oreid.io/developer), create a new Telos/other EOS derivative application and grab your App ID *(You can grab it in the ore-id developer dashboard, image below)*.
-   Basic knowledge of React.js and JavaScript.
-   A basic understanding of Telos and its features.
-   A Telos dApp that you would like to integrate with UAL. (We'll be showing an example with a super simple demo app).
<p align="center">
	<img src="https://lh3.googleusercontent.com/BuCPN5rvmBUGg97KmbL2fW2b0ZmgdQh1acN0pe_mGH8Wo7sfipgjls-61DZK0p7Jn0YTAy-NFEw1h4FWr2J5xl-g_tYgo7DT5wHzwqjIqKMuJSiyV06jmrJSsYjhvoNV6bAipWmc8v4U5l4mkQQ-xaQ" alt="Ore ID dev portal" width="470" height="534">
</p>

 ## 1. Installation

To install UAL deps, run the following command in your terminal:

`npm  install  oreid-webpopup  ual-oreid  ual-reactjs-renderer eosjs`

**oreid-webpopup** - A simple webpopup UI acting as the actual authentication frontend *(Alternatives include options like ledger wallet, anchor wallet and more...)*.

**ual-oreid** - Our UAL plugin. All you *(the developer)* needs to do is plug this into the ual-react-js-renderer's UALProvider component and your dApp has out of the box authorisation/authentication with ore-id.

**ual-reactjs-renderer** - A ready made UI component to support the authZ/authN flow. See image below:
<p align="center">
	<img src="https://raw.githubusercontent.com/EOSIO/universal-authenticator-library/HEAD/.images/ual-login.png" alt="UAL modal" width="600" height="500">
</p>

## 2. Setting up the UAL provider

1. **Import the deps mentioned above into your React app:**
```
import  {  OreIdAuthenticator,  AuthProvider  }  from  'ual-oreid'
import  {  WebPopup  }  from  'oreid-webpopup'
import  {  UALProvider,  withUAL  }  from  'ual-reactjs-renderer'
```

3. **The Transaction app setting up the UAL provider**

Let's start with the overall structure of the app to see how UAL is used:
```
const TransactionApp = ({ ual }: any) => {...}

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
```
1. In our default export that's being rendered, we're using the previously imported `UALprovider` passing in `chains`, `authenticators` and `appName`.
2. The TransactionApp will be wrapped in the `withUAL` higher-order component as to hydrate it with some of the context listed above into a new component, `TestAppConsumer`.
3. Now Actions like signing transactions, logging in/out etc are ready for you to use and implement in your dApp without having to implement this functionality from scratch. 
4. Using UAL you can bypass a lot of the work you would've had to do [here](https://github.com/TeamAikon/oreid) while also being able to support multiple providers like Anchor wallet.

## 3. Configuring the network

The chain metadata for the network should be shaped as `teslosTestNet` is. You can dig into the interfaces [here](https://github.com/EOSIO/universal-authenticator-library/blob/master/src/UAL.ts).
```
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
```
## 3. Setting up transactions

Here's a test transaction:
```
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
```
## 4. Interacting with UAL in a React Component
#### Accessing the active user and their account information
We have access to useful information like the active user from the UAL props passed into our App component. From this object we have access to everything we need through a standard interface to query the account's balance across EOS providers and chains.

Add this to your `TransactionApp` component:
```
const TransactionApp = ({ ual }: any) => {
  
  // Log this object to console and see what it contains.
  const { activeUser } = ual;

  // Everything else we need can be obtained through the 
  // activeUser from `ual` context
  const [activeUserState, setActiveUserState] = React.useState(null);
  const [accountName, setAccountName] = React.useState('');
  const [accountBalance, setAccountBalance] = React.useState(null);
  const rpc: JsonRpc = new JsonRpc(
    `${TELOS_TEST.RPC_PROTOCOL}://${TELOS_TEST.RPC_HOST}:${TELOS_TEST.RPC_PORT}`,
    { fetch }
  );
```

#### Displaying the UAL modal, transferring tokens and displaying information
The rest is standard React. Here's the rest of the `TransactionApp` component for reference:
```
const TransactionApp = ({ ual }: any) => {
  ...
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
```

