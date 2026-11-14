use serde::Serialize;
use anyhow::{Result, Error};
use std::{sync::OnceLock, time::Duration};
use system_resolver::CLASS_IN;
use trust_dns_resolver::{
	config::{ResolverConfig, ResolverOpts},
	lookup::SrvLookup,
	proto::{rr::{RecordType, rdata::SRV}, serialize::binary::BinDecodable},
	Resolver
};

#[derive(Serialize, Clone)]
pub struct Srv {
	priority: u16,
	weight: u16,
	port: u16,
	target: String,
}

static RESOLVER: OnceLock<Resolver> = OnceLock::new();

pub fn srv (url: String) -> Result<Srv, Error> {
	let name: String = format!("_ygopro._tcp.{}", url);
	let records: Option<Vec<SRV>> = lookup(&name);
	let result: Option<Srv> = records
		.unwrap_or_default()
		.into_iter()
		.min_by_key(|record: &SRV| record.priority())
		.map(|record: SRV| Srv {
			priority: record.priority(),
			weight: record.weight(),
			port: record.port(),
			target: record.target().to_string()
		});
	Ok(result.unwrap_or(Srv {
		priority: 0,
		weight: 0,
		port: 7911,
		target: url
	}))
}

fn lookup (name: &str) -> Option<Vec<SRV>> {
	let rtype: u16 = u16::from(RecordType::SRV);
	if let Ok(records) = system_resolver::lookup(name, rtype) {
		let mut result: Vec<SRV> = Vec::new();
		for record in records {
			if record.class != CLASS_IN || record.rtype != rtype {
				continue;
			}
			if let Ok(srv) = SRV::from_bytes(&record.rdata) {
				result.push(srv);
			}
		}
		if !result.is_empty() {
			return Some(result);
		}
	}
	if RESOLVER.get().is_none() {
		let mut options: ResolverOpts = ResolverOpts::default();
		options.cache_size = 256;
		options.positive_max_ttl = Some(Duration::from_secs(300));
		options.negative_max_ttl = Some(Duration::from_secs(10));

		let resolver: Resolver = Resolver::new(ResolverConfig::default(), options).ok()?;
		let _ = RESOLVER.set(resolver);
	}
	let resolver: &Resolver = RESOLVER.get()?;
	let response: SrvLookup = resolver.srv_lookup(name).ok()?;
	Some(response.into_iter().collect())
}
