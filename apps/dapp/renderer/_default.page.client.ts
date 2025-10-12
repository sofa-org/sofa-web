export { render }

async function render() {
  // For compatibility with existing setup, we delegate to the existing main.tsx
  // This preserves the current React Router setup and client-side rendering
  await import('../src/main')

  // The existing main.tsx already handles React root creation and rendering
  // So we don't need to do anything additional here
}