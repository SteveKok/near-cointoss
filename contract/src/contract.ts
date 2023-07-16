// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view, UnorderedMap } from 'near-sdk-js';
import { AccountId } from 'near-sdk-js/lib/types';
import { assert } from './helper';

type Side = 'heads' | 'tails';

function simulateCoinFlip(): Side {
	// randomSeed creates a random string, learn more about it in https://github.com/near-examples/coin-flip-js
	const randomString: string = near.randomSeed().toString();

	// If the last charCode is even we choose heads, otherwise tails
	return randomString.charCodeAt(0) % 2 ? 'heads' : 'tails';
}

@NearBindgen({})
class CoinToss {
	@call({ payableFunction: true })
	flip_coin({ player_guess }: { player_guess: Side }): Side {
		const player: AccountId = near.predecessorAccountId();
		const bet: bigint = near.attachedDeposit() as bigint;
		near.log(`${player} bets for ${player_guess} with ${bet} yoctoNEAR.`);

		const accountBalance: bigint = near.accountBalance() as bigint;
		const originalBalance: bigint = accountBalance - bet;

		// According Kelly Criterion formula, if upon win, we win 1, and upon lose, we lose 0.98
		// Then we are safe to bet as high as 1% of our asset in order to achive best possble gain
		// K% = p - q / b
		// K% = 0.5 - 0.5 / (1 / 0.98)
		// K% = 0.5 - 0.49 = 0.01
		assert(
			bet * 100n <= originalBalance,
			`Current maximum bet is ${
				originalBalance / 100n
			} yoctoNEAR. Please reduce your bet and try again.`
		);

		// Simulate a Coin Flip
		const outcome = simulateCoinFlip();

		// Check if their guess was right and modify the points accordingly
		if (player_guess == outcome) {
			const payment = (bet * 198n) / 100n;

			near.log(
				`The result was ${outcome}, you win! ${payment} yoctoNEAR will be transferred to your account.`
			);

			if (payment > 0n) {
				const promise = near.promiseBatchCreate(player);
				near.promiseBatchActionTransfer(promise, payment);
			}
		} else {
			near.log(`The result was ${outcome}, you lost!`);
		}

		return outcome;
	}
}
