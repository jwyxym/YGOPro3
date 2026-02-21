use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    pub static ref PIC_REGEX: Regex = Regex::new(r"^pics/(\d+)\.(jpg|png|jpeg)$").unwrap();
    pub static ref LINE_REGEX: Regex = Regex::new(r"\r?\n").unwrap();
}