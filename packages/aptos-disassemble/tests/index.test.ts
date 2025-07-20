import { describe, it, expect } from "vitest";
import { disassemble_to_string } from "../src/index";
import { disassembleMoveModule } from "../src/types";
describe("disassembleMoveModule", () => {
  it("test use url", async () => {
    // curl --request GET \
    // --url https://api.mainnet.aptoslabs.com/v1/accounts/0x1/modules

    const result = await (
      await fetch("https://api.mainnet.aptoslabs.com/v1/accounts/0x1/modules")
    ).json();
    for (const module of result) {
      const bytecode = Buffer.from((module.bytecode as string).replace(/^0x/i, ""), "hex");
      console.log("Module Name:", module.abi.name);
      const disassembled = disassembleMoveModule(bytecode);
      expect(disassembled).toMatchSnapshot();
      expect(disassemble_to_string(bytecode)).toMatchSnapshot();
    }
  });
});
