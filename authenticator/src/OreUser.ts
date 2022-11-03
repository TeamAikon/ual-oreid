import {
  SignTransactionResponse,
  User,
  UALErrorType,
  SignTransactionConfig
} from 'universal-authenticator-library'
import { UserData, Transaction } from 'oreid-js'
import { UALOreError } from './UALOreError'
import { OreIdAuthenticator, ChainAccount } from './OreIdAuthenticator'

/**
 * A UserData object may have many chainAccounts
 * An OreUser only has one
 */
export class OreUser extends User implements Omit<UserData, 'chainAccounts'> {
  public accountName: string
  public email: string
  public picture: URL['href']
  public name: string
  public username: string
  public delayWalletSetup?: boolean
  public chainAccount: ChainAccount
  private authenticator: OreIdAuthenticator

  constructor (
    userData: UserData,
    authenticator: OreIdAuthenticator,
    chainAccount: ChainAccount
  ) {
    super()
    this.accountName = userData.accountName
    this.email = userData.email
    this.picture = userData.picture
    this.name = userData.name
    this.username = userData.username
    this.delayWalletSetup = userData.delayWalletSetup
    this.authenticator = authenticator
    this.chainAccount = chainAccount
  }

  /**
   * @param transactionBody  The transaction to be signed (a object that matches the RpcAPI structure).
   * @param options  Options for tapos fields
   */
  async signTransaction (
    transactionBody: any,
    options: SignTransactionConfig
  ): Promise<SignTransactionResponse> {
    let transaction: Transaction
    try {
      transaction = await this.authenticator.oreId.createTransaction({
        chainAccount: this.accountName,
        chainNetwork: this.chainAccount.chainNetwork,
        transaction: transactionBody,
        signOptions: {
          broadcast: !!options.broadcast,
          returnSignedTransaction: false
        }
      })
    } catch (err) {
      throw new UALOreError(
        'Error creating transaction',
        UALErrorType.Signing,
        (err as any).message
      )
    }

    let signResult
    try {
      signResult = await this.authenticator.oreId.popup.sign({
        transaction
      })
    } catch (err) {
      throw new UALOreError(
        'Error signing transaction',
        UALErrorType.Signing,
        (err as any).message
      )
    }
    return {
      wasBroadcast: !!options.broadcast,
      transaction: transaction.data,
      transactionId: signResult.transactionId
    }
  }

  async signArbitrary (): Promise<string> {
    throw new UALOreError(
      'ORE ID Wallet does not currently support signArbitrary',
      UALErrorType.Unsupported,
      null
    )
  }

  async verifyKeyOwnership (): Promise<boolean> {
    throw new UALOreError(
      'ORE ID does not currently support verifyKeyOwnership',
      UALErrorType.Unsupported,
      null
    )
  }

  async getAccountName (): Promise<string> {
    return this.accountName
  }

  async getChainId (): Promise<string> {
    return this.chainAccount.chainId
  }

  async getKeys () {
    return this.chainAccount.permissions
      .filter(p => p.publicKey)
      .map(p => p.publicKey as string)
  }
}
