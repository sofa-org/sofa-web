// use chrono::{Duration, TimeZone, Utc};
use once_cell::sync::Lazy;
use wasm_bindgen::prelude::*;

mod modules;

static APY_DEFINITION: Lazy<modules::apy::ApyDefinition> =
    Lazy::new(|| modules::apy::ApyDefinition::AaveLendingAPY);

#[wasm_bindgen]
pub fn calc_apy(yield_amount: f64, deposit_amount: f64, ref_milli: f64, exp_milli: f64) -> f64 {
    return APY_DEFINITION.calc_apy(
        yield_amount,
        deposit_amount,
        ref_milli as i64,
        exp_milli as i64,
    );
}

#[wasm_bindgen]
pub fn calc_yield(apy: f64, deposit_amount: f64, ref_milli: f64, exp_milli: f64) -> f64 {
    return APY_DEFINITION.calc_yield(apy, deposit_amount, ref_milli as i64, exp_milli as i64);
}
