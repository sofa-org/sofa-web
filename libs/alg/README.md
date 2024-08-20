# Rust + Wasm

## Pre installed for Rust dev

- [Rust](https://www.rust-lang.org/learn/get-started)
- [wasm-pack](https://github.com/rustwasm/wasm-pack)

## Usage

当你使用包内暴露的方法或者对象时，请确保 wasm 已经初始化完成。

> 好的方式:
> 在项目应用中，先对 wasm 初始化，完成之后再进入项目的初始化或者渲染，这样在其他用的地方，就可以不必反反复复的使用初始化的逻辑，并且可以用同步方式调用 wasm 的脚本方法（这种方法的弊端就是会影响一点点的 FCP 性能）
