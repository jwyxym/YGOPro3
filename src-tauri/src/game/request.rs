use crate::game::version::URL;
use tauri::{AppHandle, Emitter};
use anyhow::{Result, Error, anyhow};
use content_disposition::parse_content_disposition;
use uuid::Uuid;
use serde::Serialize;
use std::{path::Path, io::Read, sync::OnceLock};
use trust_dns_resolver::{config::{ResolverConfig, ResolverOpts}, Resolver};
use tokio::{
	fs::File,
	io::AsyncWriteExt,
	task::{JoinHandle, spawn},
	time::{timeout, Duration}
};
use futures::{stream::FuturesUnordered, StreamExt};
use ureq::{
	get,
	http::{Response, HeaderMap},
	typestate::WithoutBody,
	Body,
	BodyReader,
	RequestBuilder
};

#[derive(Serialize, Clone)]
pub struct Srv {
	priority: u16,
	weight: u16,
	port: u16,
	target: String,
}

pub static RESOLVER: OnceLock<Resolver> = OnceLock::new();
pub struct Request;
impl Request {
	pub async  fn test_speed (urls: &Vec<URL>) -> Result<URL, Error> {
		let tasks: Vec<JoinHandle<Result<(URL, bool), Error>>> = urls
			.clone()
			.into_iter()
			.map(|url| {
				spawn(async move {
					timeout(
						Duration::from_secs(3),
						async {
							let response: Response<Body> = get(url.speed_test_url()).call()?;
							Ok((url, response.status().is_success()))
						}
					).await?
				})
			}).collect();
		let mut tasks: FuturesUnordered<JoinHandle<Result<(URL, bool), Error>>> = tasks.into_iter().collect::<FuturesUnordered<_>>();
		let mut result: Vec<URL> = Vec::new();
		while let Some(task) = tasks.next().await {
			if let Ok(task) = task {
				if let Ok(task) = task && task.1 {
					result.push(task.0)
				}
			}
		}
		let result: &URL = result.get(0).ok_or(anyhow!(""))?;
		Ok(result.clone())
	}
	pub async fn version (url: &URL, version: i64) -> bool {
		async move || -> Result<bool, Error> {
			let mut req: RequestBuilder<WithoutBody> = get(url.version_url());
			for (key, value) in url
				.request_header()
				.into_iter() {
				req = req.header(key, value);
			}
			let response: Response<Body> = req.call()?;
			if response.status().is_success() {
				let mut body: Body = response.into_body();
				let mut reader: BodyReader<'_> = body.as_reader();
				let mut content: String = String::new();
				reader.read_to_string(&mut content)?;
				Ok(!content.contains(&format!("YGOPRO3://{}", version)))
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
	pub async fn srv(url: String) -> Result<Srv, Error> {
		let resolver: &Resolver = RESOLVER.get_or_init(|| {
			Resolver::new(ResolverConfig::default(), ResolverOpts::default())
				.expect("DNS resolver error")
		});

		Ok(if let Ok(response) = resolver.srv_lookup(&url) {
			let mut result: Vec<Srv> = response.into_iter().map(|ip| {
				Srv {
					priority: ip.priority(),
					weight: ip.weight(),
					port: ip.port(),
					target: ip.target().to_string()
				}
			}).collect();
			result.sort_by_key(|srv| srv.priority);
			result.get(0).ok_or(anyhow!("DNS error"))?.clone()
		} else {
			Srv {
				priority: 0,
				weight: 0,
				port: 7911,
				target: url
			}
		})
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