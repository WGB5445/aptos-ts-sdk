# Move VM 学习示例

本项目是一个基于 TypeScript 的 Move 虚拟机（VM）学习示例，旨在帮助开发者理解 Move 字节码的解析、反汇编和执行过程。

## 主要功能
- 解析 Move 字节码模块
- 反汇编模块，展示指令和结构
- 实现一个简单的 Move 虚拟机，支持基本的函数调用和操作数栈
- 支持常见的 Move 标准库模块（如 vector、string、option 等）
- 提供基础的单元测试，验证 VM 的执行结果

## 当前进度
- 目前仅实现了部分模块的解析和简单的函数调用
- 支持部分标准库函数和结构体
- 代码结构和功能还在不断完善中

## 适用人群
- Move 智能合约开发者
- 对区块链虚拟机原理感兴趣的开发者
- TypeScript/JavaScript 工程师

## 如何使用
1. 克隆本仓库
2. 安装依赖：`pnpm install`
3. 运行测试：`pnpm test`

## 目录结构
- `packages/move-vm/`：Move 虚拟机核心实现与测试
- `packages/aptos-disassemble/`：Move 字节码反汇编工具
- 其他相关工具包
其他相关工具包

## 测试用例示例
下面是一个简化版的测试用例，帮助大家理解如何调用 Move 虚拟机并验证结果：

```typescript
import { SimpleMoveVM } from "../src/vm";
import { U64, Vec } from "../src/types";

const vm = new SimpleMoveVM(/* ...参数略 */);

// 假设已加载 simple_module 到 vm.module_map
const func = {
  address: "0x0000000000000000000000000000000000000000000000000000000000001234",
  module: "simple",
  name: "add",
  type_args: [],
  args: [new U64(1n), new U64(2n)],
};

const result = vm.callFunction(func);
console.log(result); // 输出: [U64(3n)]

const result_vector = vm.callFunction({
  address: func.address,
  module: "simple",
  name: "test_vector",
  type_args: [],
  args: [],
});
console.log(result_vector); // 输出: [Vec([U64(1n), U64(2n), U64(3n)])]
```

更多复杂用法请参考 `tests/vm.test.ts`。

## 注意事项
- 本项目仅供学习和参考，尚未实现完整的 Move 虚拟机功能
- 部分代码和接口可能会有较大调整

## 贡献
欢迎提出 issue 或 PR，一起完善 TypeScript 版 Move VM！
