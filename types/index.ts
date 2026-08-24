// Re-export all types from feature modules
export * from './account'
export * from './api'
export * from './arte'
export * from './courses'
export * from './ui'
export * from './server'

// Backwards-compatible aliases (temporary)
export type AirtableBehaviour = import('./arte').ArteBehaviour
export type AirtableSystem = import('./arte').ArteSystem
export type AirtablePurpose = import('./arte').ArtePurpose
export type AirtableProvision = import('./arte').ArteProvision