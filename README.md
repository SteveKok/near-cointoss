## Getting Started

To run this code, first install NEAR-cli.

```bash
npm install -g near-cli
```

After that, create an account and login. Your account should be `YOURNAME.testnet`

```bash
near login
near create-account cointoss.YOURNAME.testnet
```

Then, clone this repo and run

```bash
npm install
```

After that, run these instructions one by one.

```bash
npm run build
near deploy --accountId cointoss.YOURNAME.testnet --wasmFile contract/build/cointoss-contract.wasm
```

To test whether or not the contract had been deployed succesfully, try to make a call

```bash
near call cointoss.YOURNAME.testnet flip_coin '{"player_guess":"heads"}' --accountId YOURNAME.testnet --deposit 0.5
```

Finally, run the server by:

```bash
npm run start
```

## To do

Currently only can successfully call the contract, but user is not informed on the result of the function call.
