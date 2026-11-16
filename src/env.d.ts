/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Set by middleware for private routes after an active session is verified */
    auth?: import('@/types/index').AuthState;
  }
}
