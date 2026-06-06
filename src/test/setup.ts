import '@testing-library/jest-dom'

// JSDOM polyfills required by Radix UI components
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver

// Silence missing scrollIntoView in JSDOM
window.HTMLElement.prototype.scrollIntoView = () => {}
