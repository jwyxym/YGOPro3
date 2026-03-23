use tauri::{AppHandle, Emitter};
use anyhow::{Result, Error, anyhow};
use content_disposition::parse_content_disposition;
use uuid::Uuid;
use serde::Serialize;
use std::{path::Path, io::Read, sync::OnceLock};
use trust_dns_resolver::{config::{ResolverConfig, ResolverOpts}, Resolver, lookup::SrvLookup, proto::rr::rdata::SRV};
use tokio::{
	fs::File,
	io::AsyncWriteExt
};
use ureq::{
	get,
	http::{Response, HeaderMap},
	Body,
	BodyReader
};

#[derive(Serialize, Clone)]
pub struct Srv {
	priority: u16,
	weight: u16,
	port: u16,
	target: String,
}

static RESOLVER: OnceLock<Resolver> = OnceLock::new();
pub struct Request;
impl Request {
	pub async fn version (url: &str, version: &str) -> bool {
		async move || -> Result<bool, Error> {
			let response: Response<Body> = get(url).call()?;
			if response.status().is_success() {
				let mut body: Body = response.into_body();
				let mut reader: BodyReader<'_> = body.as_reader();
				let mut content: String = String::new();
				reader.read_to_string(&mut content)?;
				Ok(content.contains(version))
			} else {
				Err(anyhow!("{}", response.status()))
			}
		}()
			.await
			.unwrap_or(false)
		
	}
    pub async fn download<P: AsRef<Path>> (app: &AppHandle, path: P, url: &str, name: &str) -> Result<String, Error> {
        let response: Response<Body> = get(url).call()?;
		if response.status().is_success() {
			let headers: &HeaderMap = response.headers();
			let name: String = Self::name(name, headers);
			let size: i64 = Self::size(headers);
			app.emit("started", size)?;
			let path: &Path = path.as_ref();

			let mut body: Body = response.into_body();
			let mut reader: BodyReader<'_> = body.as_reader();

			let mut file: File = File::create(path.join(&name)).await?;
			let mut buffer: Vec<u8> = vec![0u8; 8192];
			loop {
				let bytes: usize = reader.read(&mut buffer)?;
				if bytes == 0 {
					break;
				}
				app.emit("progress", 8192)?;
				file.write_all(&buffer[..bytes]).await?;
			}
			app.emit("end", 0)?;
			Ok(name)
		} else {
			Err(anyhow!("{}", response.status()))
		}
    }
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

	fn name (name: &str, headers: &HeaderMap) -> String {
		if name.len() > 0 {
			return String::from(name);
		}
		headers
			.get("Content-Disposition")
			.and_then(|header| header.to_str().ok())
			.and_then(|content| parse_content_disposition(content).filename())
			.map(|(filename, extension)| {
				if let Some(ext) = extension {
					format!("{}.{}", filename, ext)
				} else {
					filename
				}
			})
			.unwrap_or({
				let id: Uuid = Uuid::new_v4();
				id.to_string()
			})
	}
	fn size (headers: &HeaderMap) -> i64 {
		headers
			.get("content-length")
			.and_then(|len|
				len.to_str()
					.ok()
					.and_then(|s| s.parse::<i64>().ok())
			)
			.unwrap_or(0)
	}
}