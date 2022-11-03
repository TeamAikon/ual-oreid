import {
  Authenticator,
  Chain,
  User,
  UALError,
  UALErrorType
} from 'universal-authenticator-library'
import {
  OreId,
  AuthProvider,
  OreIdOptions,
  UserData,
  UserChainAccount
} from 'oreid-js'
import { OreUser } from './OreUser'
import { OreIdIcon } from './OreIdIcon'
import { UALOreError } from './UALOreError'

export { AuthProvider }

export type ChainAccount = UserChainAccount & { chainId: string }

export class OreIdAuthenticator extends Authenticator {
  private users: OreUser[] = []
  private initializationError: Error | undefined
  private initialized: boolean = false
  public oreId: OreId
  public authProvider: AuthProvider

  constructor (
    chains: Chain[],
    options: OreIdOptions,
    authProvider: AuthProvider
  ) {
    super(chains, options)
    this.oreId = new OreId(this.options)
    this.authProvider = authProvider
  }

  /**
   * Called after `shouldRender` and should be used to handle any async actions required to initialize the authenticator
   */
  async init (): Promise<void> {
    try {
      await this.oreId.init()
      this.initialized = true
    } catch (err) {
      this.initializationError = new UALOreError(
        'OreId failed to initialize',
        UALErrorType.Initialization,
        err as Error
      )
    }
  }

  /**
   * Resets the authenticator to its initial, default state then calls `init` method
   */
  reset () {
    this.oreId = new OreId(this.options)
    this.users = []
    this.initializationError = undefined
    this.initialized = false
  }

  /**
   * Returns true if the authenticator has errored while initializing.
   */
  isErrored () {
    return !!this.initializationError
  }

  /**
   * Returns a URL where the user can download and install the underlying authenticator
   * if it is not found by the UAL Authenticator.
   */
  getOnboardingLink () {
    return 'https://oreid.io/'
  }

  /**
   * Returns error (if available) if the authenticator has errored while initializing.
   */
  getError (): UALError | null {
    return (this.initializationError as UALError) || null
  }

  /**
   * Returns true if the authenticator is loading while initializing its internal state.
   */
  isLoading (): boolean {
    return !(this.initialized || this.initializationError)
  }

  /**
   * Returns the style of the Button that will be rendered.
   */
  getStyle () {
    return {
      icon: OreIdIcon,
      text: 'ORE ID Wallet',
      textColor: 'white',
      background: '#4e19eb'
    }
  }

  /**
   * Returns whether or not the button should render based on the operating environment and other factors.
   * ie. If your Authenticator App does not support mobile, it returns false when running in a mobile browser.
   */
  shouldRender () {
    return true
  }

  /**
   * Returns whether or not the dapp should attempt to auto login with the Authenticator app.
   * Auto login will only occur when there is only one Authenticator that returns shouldRender() true and
   * shouldAutoLogin() true.
   */
  shouldAutoLogin () {
    return false
  }

  /**
   * Returns whether or not the button should show an account name input field.
   * This is for Authenticators that do not have a concept of account names.
   */
  async shouldRequestAccountName (): Promise<boolean> {
    return false
  }

  /**
   * Returns the amount of seconds after the authentication will be invalid for logging in on new
   * browser sessions.  Setting this value to zero will cause users to re-attempt authentication on
   * every new browser session.  Please note that the invalidate time will be saved client-side and
   * should not be relied on for security.
   */
  public shouldInvalidateAfter (): number {
    return 86400
  }

  private async authenticateWithOreId (): Promise<UserData> {
    try {
      const result = await this.oreId.popup.auth({
        provider: this.authProvider
      })
      return result.user
    } catch (err) {
      throw new UALOreError(
        'An error occurred authenticating with OreId',
        UALErrorType.Login,
        err as Error
      )
    }
  }

  /**
   * Login using the Authenticator App. This can return one or more users depending on multiple chain support.
   */
  async login (): Promise<User[]> {
    const oreUser = await this.authenticateWithOreId()
    console.log({ oreUser })

    for (const chain of this.chains) {
      const network = await this.oreId.settings.getChainNetworkByChainId(
        chain.chainId
      )

      const account = oreUser.chainAccounts.find(
        ca => ca.chainNetwork === network
      )
      if (!account) {
        throw new UALOreError(
          `User does not have an account for chain: ${network}`,
          UALErrorType.Login,
          null
        )
      }

      const accountName = account?.chainAccount || 'no account'

      this.users.push(
        new OreUser({ ...oreUser, accountName }, this, {
          ...account,
          chainId: chain.chainId
        })
      )
    }
    return this.users
  }

  /**
   * Logs the user out of the dapp. This will be strongly dependent on each Authenticator app's patterns.
   */
  async logout () {
    // this.initWaxJS();
    this.oreId.logout()
    this.users = []
    localStorage.setItem('ual-ore:autologin', 'null')
    console.log(`UAL-ORE: logout`)
  }

  /**
   * Returns true if user confirmation is required for `getKeys`
   */
  requiresGetKeyConfirmation (): boolean {
    return false
  }

  /**
   * Returns name of authenticator for persistence in local storage
   */
  getName (): string {
    return 'ual-oreid'
  }
}
