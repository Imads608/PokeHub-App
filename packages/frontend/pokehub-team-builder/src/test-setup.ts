import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder/TextDecoder
Object.assign(global, { TextEncoder, TextDecoder });

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock scrollIntoView (not available in jsdom)
Element.prototype.scrollIntoView = jest.fn();

// Mock hasPointerCapture (not available in jsdom, required by Radix UI)
Element.prototype.hasPointerCapture = jest.fn();
Element.prototype.setPointerCapture = jest.fn();
Element.prototype.releasePointerCapture = jest.fn();
