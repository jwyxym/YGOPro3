use crate::{progress::{self, Event}, game::Game};
use tauri::AppHandle;
use anyhow::{Result, Error, anyhow};
use content_disposition::parse_content_disposition;
use uuid::Uuid;
use serde::Serialize;
use std::{path::Path, io::Read, sync::OnceLock, fs::create_dir_all, collections::BTreeMap};
use trust_dns_resolver::{
	config::{ResolverConfig, ResolverOpts},
	Resolver,
	lookup::SrvLookup,
	proto::rr::rdata::SRV
};
use futures::{StreamExt, stream::FuturesUnordered};
use tokio::{
	fs::File,
	task::{JoinHandle, spawn_blocking},
	io::AsyncWriteExt
};
use ureq::{
	get,
	http::{Response, HeaderMap, StatusCode},
	Body,
	BodyReader,
	RequestBuilder,
	typestate::WithoutBody
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
		tokio::task::spawn_blocking({
			let url: String = String::from(url);
			let version: String = String::from(version);
			move || -> Result<bool, Error> {
				let response: Response<Body> = get(url).call()?;
				if response.status().is_success() {
					let mut body: Body = response.into_body();
					let mut reader: BodyReader<'_> = body.as_reader();
					let mut content: String = String::new();
					reader.read_to_string(&mut content)?;
					Ok(content.contains(&version))
				} else {
					Err(anyhow!("{}", response.status()))
				}
			}
		}).await.ok().and_then(|r| r.ok()).unwrap_or(false)
	}
	pub async fn download_chunks (
		app: &AppHandle,
		url: &str,
		name: String,
		path: &Path,
		size: usize,
		step: usize,
		mut chunk: usize,
		first_chunk: Vec<u8>
	) -> Result<String, Error> {
		let mut tasks: Vec<JoinHandle<Result<(u32, Vec<u8>), Error>>> = Vec::new();
		let mut index: u32 = 1;
		let (_, max_retries) = Game::get_system()
			.await?
			.2
			.into_iter()
			.find(|i|
				i.0 == "CT_DOWNLOADCHUNKS_RETRIES"
			)
			.unwrap_or((String::new(), 8.0));
		while chunk < size {
			let url: String = String::from(url);
			tasks.push(spawn_blocking(move || -> Result<(u32, Vec<u8>), Error> {
				let mut retries: f64 = 0.0;
				loop {
					let body: RequestBuilder<WithoutBody> = get(&url)
						.header("Range", format!("bytes={}-{}", chunk, (chunk + step - 1).min(size - 1)));
					match body.call() {
						Ok(res) => {
							if res.status().is_success() {
								let mut res_body: Body = res.into_body();
								let mut res_reader: BodyReader<'_> = res_body.as_reader();
								let mut data: Vec<u8> = Vec::new();
								res_reader.read_to_end(&mut data)?;
								break Ok((index, data));
							} else {
								if retries >= max_retries {
									break Err(
										anyhow!("error at chunk {}-{}: {}",
											chunk,
											chunk + step,
											res.status()
										)
									);
								}
								retries += 1.0;
								continue;
							}
						}
						Err(e) => {
							if retries >= max_retries {
								break Err(
									anyhow!("error at chunk {}-{}: {}",
										chunk,
										chunk + step,
										e
									)
								);
							}
							retries += 1.0;
							continue;
						}
					}
				}
			}));
			index += 1;
			chunk += step;
		}
		let mut tasks: FuturesUnordered<JoinHandle<Result<(u32, Vec<u8>), Error>>> = tasks
			.into_iter()
			.collect::<FuturesUnordered<_>>();
		let res: Result<String, Error> = match (async || -> Result<BTreeMap<u32, Vec<u8>>, Error> {
			let mut map: BTreeMap<u32, Vec<u8>> = BTreeMap::new();
			map.insert(0, first_chunk);
			while let Some(task) = tasks.next().await {
				let (key, value) = task??;
				map.insert(key, value);
				progress::emit(app, Event::Progress, step);
			}
			Ok(map)
		})().await {
			Ok(map) => {
				let mut file: File = File::create(path.join(&name)).await?;
				for v in map.values() {
					file.write_all(v).await?;
				}
				Ok(name)
			}
			Err(e) => Err(e)
		};
		progress::emit(app, Event::End, 0);
		res
	}
	pub async fn download<P: AsRef<Path>> (app: &AppHandle, path: P, url: &str, name: &str, step: usize) -> Result<String, Error> {
		create_dir_all(&path)?;
		let mut chunk: usize = 0;
		let body: RequestBuilder<WithoutBody> = if step > 0 {
			get(url)
				.header("Range", format!("bytes={}-{}", chunk, chunk + step - 1))
		} else { get(url) };
		chunk += step;
		let response: Response<Body> = body.call()?;
		let status: StatusCode = response.status();
		if status.is_success() {
			let headers: &HeaderMap = response.headers();
			let name: String = Self::name(name, headers);
			let size: usize = Self::size(headers, status);
			progress::emit(app, Event::Start, size);
			let path: &Path = path.as_ref();

			let mut body: Body = response.into_body();
			let mut reader: BodyReader<'_> = body.as_reader();

			if status == 206 {
				let mut buffer: Vec<u8> = Vec::new();
				reader.read_to_end(&mut buffer)?;
				Self::download_chunks(app, url, name, path, size, step, chunk, buffer)
					.await
			} else {
				let mut file: File = File::create(path.join(&name)).await?;
				let mut buffer: Vec<u8> = vec![0u8; 8192];
				loop {
					let bytes: usize = reader.read(&mut buffer)?;
					if bytes == 0 {
						break;
					}
					progress::emit(app, Event::Progress, 8192);
					file.write_all(&buffer[..bytes]).await?;
				}
				progress::emit(app, Event::End, 0);
				Ok(name)
			}
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
	fn size (headers: &HeaderMap, status: StatusCode) -> usize {
		if status == 206 {
			headers
				.get("Content-Range")
				.and_then(|len|
					len.to_str()
						.ok()
						.and_then(|s| if let Some(s) = s.
							split("/")
							.collect::<Vec<&str>>()
							.get(1) {
								s.parse::<usize>().ok()
							} else {
								None
							}
						)
				)
				.unwrap_or(0)
		} else {
			headers
				.get("Content-Length")
				.and_then(|len|
					len.to_str()
						.ok()
						.and_then(|s| s.parse::<usize>().ok())
				)
				.unwrap_or(1024 * 1024 * 100)
		}
	}
}
