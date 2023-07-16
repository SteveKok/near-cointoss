'use client';

import { useState, useEffect, useRef } from 'react';
import useSWRMutation from 'swr/mutation';

import type {
	WalletConnection,
	ConnectedWalletAccount,
} from 'near-api-js/lib/wallet-account.d.ts';
import type { AccountBalance } from 'near-api-js/lib/account.d.ts';

type Side = 'heads' | 'tails';

export default function Home() {
	const [walletConnection, setWalletConnection] = useState<WalletConnection>();
	const [account, setAccount] = useState<ConnectedWalletAccount>();
	const [accountBalance, setAccountBalance] = useState<AccountBalance>();
	const betAmountRef = useRef<HTMLInputElement>(null);
	const { trigger: sendBet, isMutating: isBetting } = useSWRMutation(
		'cointoss.stevekok.testnet/flip_coin',
		(url, { arg }: { arg: { betAmount: bigint; playerGuess: Side } }) => {
			const [contractId, methodName] = url.split('/');

			return (account as any)?.functionCall({
				args: { player_guess: arg.playerGuess },
				attachedDeposit: arg.betAmount,
				contractId,
				methodName,
				walletCallbackUrl: 'http://localhost:3000',
			});
		}
	);

	useEffect(() => {
		async function init() {
			const { connect, keyStores, WalletConnection } = await import(
				'near-api-js'
			);

			const connectionConfig = {
				networkId: 'testnet',
				keyStore: new keyStores.BrowserLocalStorageKeyStore(),
				nodeUrl: 'https://rpc.testnet.near.org',
				walletUrl: 'https://wallet.testnet.near.org',
				helperUrl: 'https://helper.testnet.near.org',
				explorerUrl: 'https://explorer.testnet.near.org',
			};

			// connect to NEAR
			const nearConnection = await connect(connectionConfig);

			// create wallet connection
			const walletConnection = new WalletConnection(
				nearConnection,
				'cointoss-app'
			);

			const account = walletConnection.account();
			const accountBalance = await account.getAccountBalance();

			setWalletConnection(walletConnection);
			setAccount(account);
			setAccountBalance(accountBalance);
		}

		init();
	}, []);

	if (!walletConnection) {
		return <>Loading...</>;
	}

	if (!account) {
		return (
			<div className='flex flex-col'>
				<div className='w-full bg-orange-200 text-blue-800 p-4 text-center'>
					Please sign in with your NEAR testnet wallet account in order to use
					this app.
				</div>
				<button
					className='w-full p-4 bg-gradient-to-br from-orange-400 to-red-500 text-blue-800 text-xl'
					onClick={() => {
						walletConnection.requestSignIn({
							contractId: 'cointoss.stevekok.testnet',
							methodNames: ['flip_coin'],
							successUrl: 'http://localhost:3000',
							failureUrl: 'http://localhost:3000',
						});
					}}>
					Sign In
				</button>
			</div>
		);
	}

	return (
		<div>
			<div className='w-full bg-orange-200 text-blue-800 p-4 text-center'>
				Account ID: {account.accountId}
				<br />
				Available Account Balance: {accountBalance?.available} yoctoNEAR
				<br />
			</div>
			{isBetting ? (
				<div className='mt-4 w-full bg-orange-200 text-blue-800 p-4 text-center'>
					Please wait... sending your bet to the blockchain.
				</div>
			) : (
				<div className='mt-4 w-full bg-orange-200 text-blue-800 p-4 text-center'>
					You can play a coin flip game to gamble. If heads, you can earn 1.98x
					whatever amount you bet. If tails, you will lose all your bets.
					<div className='font-extrabold mt-3 text-2xl'>
						Amount to bet in yoctoNEAR:
					</div>
					<input
						className='mt-1 w-4/5 p-3 text-lg text-center'
						type='text'
						defaultValue='500000000000000000000000'
						ref={betAmountRef}
					/>
					<button
						className='mt-2 w-4/5 p-4 bg-gradient-to-br from-orange-400 to-red-500 text-blue-800 text-xl'
						onClick={() => {
							sendBet({
								betAmount: BigInt(betAmountRef.current?.value ?? '0'),
								playerGuess: 'heads',
							});
						}}>
						Bet
					</button>
				</div>
			)}
			<button
				className='mt-4 w-full p-4 bg-gradient-to-br from-orange-400 to-red-500 text-blue-800 text-xl'
				onClick={() => {
					walletConnection.signOut();
					setAccount(undefined);
				}}>
				Sign Out
			</button>
		</div>
	);
}
