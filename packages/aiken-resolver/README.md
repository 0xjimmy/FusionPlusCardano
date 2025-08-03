# cardano-resolver

Write validators in the `validators` folder, and supporting functions in the `lib` folder using `.ak` as a file extension.

```aiken
validator my_first_validator {
  spend(_datum: Option<Data>, _redeemer: Data, _output_reference: Data, _context: Data) {
    True
  }
}
```

## Building

```sh
aiken build
```

## Configuring

**aiken.toml**
```toml
[config.default]
network_id = 41
```

Or, alternatively, write conditional environment modules under `env`.

## Testing

You can write tests in any module using the `test` keyword. For example:

```aiken
use config

test foo() {
  config.network_id + 1 == 42
}
```

To run all tests, simply do:

```sh
aiken check
```

To run only tests matching the string `foo`, do:

```sh
aiken check -m foo
```

## Documentation

If you're writing a library, you might want to generate an HTML documentation for it.

Use:

```sh
aiken docs
```

## Deployment

### Deploy to Preview Network

To deploy the source escrow validator to the Cardano preview network:

1. **Build the contracts:**
   ```sh
   aiken build
   ```

2. **Test the deployment setup (optional):**
   ```sh
   bun run test-deploy-setup
   ```

3. **Deploy to preview network:**
   ```sh
   bun run deploy-preview
   ```

The deployment script will:
- Connect to the Cardano preview network
- Deploy the source escrow validator
- Lock 2 ADA in the script address
- Log the transaction hash, output index, and script hash
- Save deployment details to `deployment-preview.json`

The test script will:
- Verify the deployment setup without submitting transactions
- Check that all components are properly configured
- Save test deployment info to `deployment-preview-test.json`

### Deployment Output

The script will output:
- Transaction hash
- Output index (UTXO index)
- Script hash
- Script address
- Amount locked in the script

## Resources

Find more on the [Aiken's user manual](https://aiken-lang.org).
