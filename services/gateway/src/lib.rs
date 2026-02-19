//! turbo-engine API gateway — library entrypoint.
//!
//! This module re-exports internal modules so that integration tests (in
//! `tests/`) and any future crates can access the gateway's types.

pub mod config;
pub mod error;
pub mod middleware;
pub mod proxy;
