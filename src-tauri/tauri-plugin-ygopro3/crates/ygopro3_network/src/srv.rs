use serde::Serialize;
use anyhow::{Result, Error, anyhow};
use std::sync::OnceLock;
use trust_dns_resolver::{
	config::{ResolverConfig, ResolverOpts},
	Resolver,
	lookup::SrvLookup,
	proto::rr::rdata::SRV
};

#[derive(Serialize, Clone)]
pub struct Srv {
	priority: u16,
	weight: u16,
	port: u16,
	target: String,
}

static RESOLVER: OnceLock<Resolver> = OnceLock::new();

pub fn srv(url: String) -> Result<Srv, Error> {
	let resolver: &Resolver = RESOLVER.get_or_init(|| {
		Resolver::new(ResolverConfig::default(), ResolverOpts::default())
			.expect("DNS resolver error")
	});
	Ok(|| -> Result<Srv, Error> {
		let response: SrvLookup = resolver.srv_lookup(format!("_ygopro._tcp.{}", url))?;
		let mut result: Vec<Srv> = response.into_iter().map(|ip: SRV| {
			Srv {
				priority: ip.priority(),
				weight: ip.weight(),
				port: ip.port(),
				target: ip.target().to_string()
			}
		}).collect();
		result.sort_by_key(|srv| srv.priority);
		Ok(result.get(0).ok_or(anyhow!("DNS error"))?.clone())
	}()
		.unwrap_or(Srv {
			priority: 0,
			weight: 0,
			port: 7911,
			target: url
		}))
}