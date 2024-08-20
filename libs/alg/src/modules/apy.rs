const EPOCH_MILLI_IN_DAY: f64 = 86_400_000.0; // Milliseconds in a day
const SECONDS_IN_DAY: f64 = 86_400.0;
const DAYS_IN_YEAR: f64 = 365.0;

trait LongExtensions {
    fn diff_in_days(&self, another: i64) -> f64;
    fn diff_in_milli(&self, another: i64) -> i64;
}

impl LongExtensions for i64 {
    fn diff_in_days(&self, another: i64) -> f64 {
        (self.diff_in_milli(another) as f64) / EPOCH_MILLI_IN_DAY
    }

    fn diff_in_milli(&self, another: i64) -> i64 {
        another - self
    }
}

enum DayCount {
    Act365,
    FixedOneYear,
    // DaysAtZoneUTC,
}

impl DayCount {
    fn calc_tenor_in_years(&self, ref_milli: i64, exp_milli: i64) -> f64 {
        self.calc_tenor_in_days(ref_milli, exp_milli) / DAYS_IN_YEAR
    }

    fn calc_tenor_in_days(&self, ref_milli: i64, exp_milli: i64) -> f64 {
        match self {
            DayCount::Act365 => ref_milli.diff_in_days(exp_milli),
            DayCount::FixedOneYear => DAYS_IN_YEAR,
            // DayCount::DaysAtZoneUTC => {
            //     let ref_date_utc = Utc.timestamp_millis_opt(ref_milli).unwrap().date_naive();
            //     let exp_date_utc = Utc.timestamp_millis_opt(exp_milli).unwrap().date_naive();
            //     ref_date_utc.signed_duration_since(exp_date_utc).num_days() as f64
            // }
        }
    }
}

pub enum ApyDefinition {
    OptimusDefaultAPY,
    // BinanceDntAPY,
    AaveLendingAPR,
    AaveLendingAPY,
}

impl ApyDefinition {
    pub fn calc_apy(
        &self,
        yield_amount: f64,
        deposit_amount: f64,
        ref_milli: i64,
        exp_milli: i64,
    ) -> f64 {
        let one_period_rtn = yield_amount / deposit_amount;
        match self {
            ApyDefinition::OptimusDefaultAPY => {
                one_period_rtn / DayCount::Act365.calc_tenor_in_years(ref_milli, exp_milli)
            }
            // ApyDefinition::BinanceDntAPY => {
            //     one_period_rtn / DayCount::DaysAtZoneUTC.calc_tenor_in_years(ref_milli, exp_milli)
            // }
            ApyDefinition::AaveLendingAPR => {
                // deposits * (1.0 + RateBySecond) ^ (seconds) = (deposits + interests)
                let tenor_in_days = DayCount::Act365.calc_tenor_in_days(ref_milli, exp_milli);
                let tenor_in_secs = tenor_in_days * SECONDS_IN_DAY;
                let rate_by_second = (1.0 + one_period_rtn).powf(1.0 / tenor_in_secs) - 1.0;
                rate_by_second * SECONDS_IN_DAY * DAYS_IN_YEAR
            }
            ApyDefinition::AaveLendingAPY => {
                let tenor_in_days = DayCount::Act365.calc_tenor_in_days(ref_milli, exp_milli);
                (1.0 + one_period_rtn).powf(DAYS_IN_YEAR / tenor_in_days) - 1.0
            }
        }
    }

    pub fn calc_yield(&self, val: f64, deposit_amount: f64, ref_milli: i64, exp_milli: i64) -> f64 {
        match self {
            ApyDefinition::OptimusDefaultAPY => {
                deposit_amount * val * DayCount::Act365.calc_tenor_in_years(ref_milli, exp_milli)
            }
            // ApyDefinition::BinanceDntAPY => {
            //     one_period_rtn / DayCount::DaysAtZoneUTC.calc_tenor_in_years(ref_milli, exp_milli)
            // }
            ApyDefinition::AaveLendingAPR => {
                // deposits * (1.0 + RateBySecond) ^ (seconds) = (deposits + interests)
                let tenor_in_days = DayCount::Act365.calc_tenor_in_days(ref_milli, exp_milli);
                let rate_by_second = val / (SECONDS_IN_DAY * DAYS_IN_YEAR);
                deposit_amount * ((1.0 + rate_by_second).powf(tenor_in_days * SECONDS_IN_DAY) - 1.0)
            }
            ApyDefinition::AaveLendingAPY => {
                let tenor_in_days = DayCount::Act365.calc_tenor_in_days(ref_milli, exp_milli);
                deposit_amount * ((1.0 + val).powf(tenor_in_days / DAYS_IN_YEAR) - 1.0)
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const deposit_amount: f64 = 10000.0;

    const ref_date: i64 = 1697011200000; // 2023-10-11T08:00:00Z
    const exp_date: i64 = 1702511940000; // 2023-12-13T23:59:00Z

    #[test]
    fn pass1() {
        let val = ApyDefinition::AaveLendingAPY.calc_apy(
            26.687380136987127,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(0.01539695062995139, val);
    }
    #[test]
    fn pass11() {
        let val = ApyDefinition::AaveLendingAPY.calc_yield(
            0.01539695062995139,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(26.687380136987127, val);
    }
    #[test]
    fn pass2() {
        let val = ApyDefinition::AaveLendingAPY.calc_apy(
            26.408219178082337,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(0.015234885367801265, val);
    }
    #[test]
    fn pass21() {
        let val = ApyDefinition::AaveLendingAPY.calc_yield(
            0.015234885367801265,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(26.408219178082337, val);
    }
    #[test]
    fn pass3() {
        let val = ApyDefinition::AaveLendingAPY.calc_apy(
            55.158973037028325,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(0.03203853099053777, val);
    }
    #[test]
    fn pass31() {
        let val = ApyDefinition::AaveLendingAPY.calc_yield(
            0.03203853099053777,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(55.158973037028325, val);
    }
    #[test]
    fn pass4() {
        let val = ApyDefinition::AaveLendingAPY.calc_apy(
            55.158973053108795,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(0.03203853099999998, val);
    }
    #[test]
    fn pass41() {
        let val = ApyDefinition::AaveLendingAPY.calc_yield(
            0.03203853099999998,
            deposit_amount,
            ref_date,
            exp_date,
        );
        assert_eq!(55.158973053108795, val);
    }
}
