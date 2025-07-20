# aptos-disassemble

Aptos Move disassembler for TypeScript. This package provides utilities to disassemble Move bytecode and modules for the Aptos blockchain.

## Usage

```ts
import { disassembleMoveModule } from 'aptos-disassemble';

// Example usage
const bytecode = ...; // Uint8Array or Buffer
const result = disassembleMoveModule(bytecode);
console.log(result);
```

## Scripts

- `pnpm build`: Build the package
- `pnpm test`: Run tests
- `pnpm lint`: Lint source files
- `pnpm fmt`: Format code

## License

MIT
