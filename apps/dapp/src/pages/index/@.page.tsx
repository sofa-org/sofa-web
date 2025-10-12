// 通配符路由页面 - 匹配所有路径
// 实际页面内容由客户端 React Router 处理

export { Page }

function Page() {
  // 这个组件只是为了满足 vite-plugin-ssr 的要求
  // 实际的页面渲染完全由客户端 React Router 处理
  // 在预渲染阶段，这个组件不会真正渲染，只是提供路由匹配
  return null
}