// import { Ledger } from 'ual-ledger'
// import { Lynx } from 'ual-lynx'
// import { Scatter } from 'ual-scatter'
import { UALProvider, withUAL } from 'ual-reactjs-renderer'

import { JsonRpc } from 'eosjs'
import * as React from 'react'
import { OreIdAuthenticator, AuthProvider } from 'ual-oreid'
import { WebPopup } from 'oreid-webpopup'

interface ExampleEnv {
  CHAIN_ID: string
  RPC_PROTOCOL: string
  RPC_HOST: string
  RPC_PORT: string
}

interface TransactionProps {
  ual: any
}

interface TransactionState {
  activeUser: any
  accountName: string
  accountBalance: any
  rpc: JsonRpc
}

const defaultState = {
  activeUser: null,
  accountName: '',
  accountBalance: null
}

const EXAMPLE_ENV: ExampleEnv = {
  CHAIN_ID: '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191',
  RPC_PROTOCOL: 'https',
  RPC_HOST: 'api-kylin.eosasia.one',
  RPC_PORT: '443'
}

const exampleNet = {
  chainId: EXAMPLE_ENV.CHAIN_ID,
  rpcEndpoints: [
    {
      protocol: EXAMPLE_ENV.RPC_PROTOCOL,
      host: EXAMPLE_ENV.RPC_HOST,
      port: Number(EXAMPLE_ENV.RPC_PORT)
    }
  ]
}

const demoTransaction = {
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
        to: 'ore1tiqqs1kq',
        quantity: '1.0000 EOS',
        memo: 'UAL rocks!'
      }
    }
  ]
}

class TransactionApp extends React.Component<
  TransactionProps,
  TransactionState
> {
  static displayName = 'TransactionApp'

  constructor (props: TransactionProps) {
    super(props)
    this.state = {
      ...defaultState,
      rpc: new JsonRpc(
        `${EXAMPLE_ENV.RPC_PROTOCOL}://${EXAMPLE_ENV.RPC_HOST}:${EXAMPLE_ENV.RPC_PORT}`,
        { fetch }
      )
    }
    this.updateAccountBalance = this.updateAccountBalance.bind(this)
    this.updateAccountName = this.updateAccountName.bind(this)
    this.renderTransferButton = this.renderTransferButton.bind(this)
    this.transfer = this.transfer.bind(this)
    this.renderModalButton = this.renderModalButton.bind(this)
  }

  public componentDidUpdate () {
    const {
      ual: { activeUser }
    } = this.props
    if (activeUser && !this.state.activeUser) {
      this.setState({ activeUser }, this.updateAccountName)
    } else if (!activeUser && this.state.activeUser) {
      this.setState(defaultState)
    }
  }

  public async updateAccountName (): Promise<void> {
    try {
      const accountName = await this.state.activeUser.getAccountName()
      this.setState({ accountName }, this.updateAccountBalance)
    } catch (e) {
      console.warn(e)
    }
  }

  public async updateAccountBalance (): Promise<void> {
    console.log({ state: this.state })
    try {
      const account = await this.state.rpc.get_account(this.state.accountName)
      const accountBalance = account.core_liquid_balance
      this.setState({ accountBalance })
    } catch (e) {
      console.warn(e)
    }
  }

  public async transfer () {
    const { accountName, activeUser } = this.state
    demoTransaction.actions[0].authorization[0].actor = accountName
    demoTransaction.actions[0].data.from = accountName
    try {
      await activeUser.signTransaction(demoTransaction, { broadcast: true })
      await this.updateAccountBalance()
    } catch (error) {
      console.warn(error)
    }
  }

  public renderModalButton () {
    return (
      <p className='ual-btn-wrapper'>
        <span
          role='button'
          onClick={this.props.ual.showModal}
          className='ual-generic-button'
        >
          Show UAL Modal
        </span>
      </p>
    )
  }

  public renderTransferButton () {
    return (
      <p className='ual-btn-wrapper'>
        <span className='ual-generic-button blue' onClick={this.transfer}>
          {'Transfer 1 eos to example'}
        </span>
      </p>
    )
  }

  public renderLogoutBtn = () => {
    const {
      ual: { activeUser, activeAuthenticator, logout }
    } = this.props
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

  public render () {
    const {
      ual: { activeUser }
    } = this.props
    const { accountBalance, accountName } = this.state
    const modalButton = !activeUser && this.renderModalButton()
    const loggedIn = accountName ? `Logged in as ${accountName}` : ''
    const myBalance = accountBalance ? `Balance: ${accountBalance}` : ''
    const transferBtn = accountBalance && this.renderTransferButton()
    return (
      <div style={{ textAlign: 'center' }}>
        {modalButton}
        <h3 className='ual-subtitle'>{loggedIn}</h3>
        <h4 className='ual-subtitle'>{myBalance}</h4>
        {transferBtn}
        {this.renderLogoutBtn()}
      </div>
    )
  }
}

const TestAppConsumer = withUAL(TransactionApp)

TestAppConsumer.displayName = 'TestAppConsumer'

const oreid = new OreIdAuthenticator(
  [exampleNet],
  {
    appId: 't_58783cf256134be29e4997550b6e69d6',
    plugins: { popup: WebPopup() }
  },
  AuthProvider.Google
)

export default () => {
  return (
    <UALProvider
      chains={[exampleNet]}
      authenticators={[oreid]}
      appName={'My App'}
    >
      <TestAppConsumer />
    </UALProvider>
  )
}
