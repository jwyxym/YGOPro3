use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, ItemFn, Block, parse_quote};

#[proc_macro_attribute]
pub fn windbot (_attr: TokenStream, item: TokenStream) -> TokenStream {
	let mut function: ItemFn = parse_macro_input!(item as ItemFn);
	let block: Box<Block> = function.block;

	function.attrs.push(parse_quote!(#[allow(unused_variables)]));
	function.block = parse_quote!({
		#[cfg(not(feature = "windbot"))]
		{
			Err(String::from("windbot is forbidden by features"))
		}

		#[cfg(all(feature = "windbot", target_arch = "x86"))]
		{
			Err(String::from("windbot is forbidden on Android x86"))
		}

		#[cfg(all(feature = "windbot", not(target_arch = "x86")))]
		{
			#block
		}
	});

	TokenStream::from(quote!(#function))
}

#[proc_macro_attribute]
pub fn single_duel (_attr: TokenStream, item: TokenStream) -> TokenStream {
	let mut function: ItemFn = parse_macro_input!(item as ItemFn);
	let block: Box<Block> = function.block;

	function.attrs.push(parse_quote!(#[allow(unused_variables)]));
	function.block = parse_quote!({
		#[cfg(not(feature = "single_duel"))]
		{
			Err(String::from("single duel is forbidden by features"))
		}

		#[cfg(feature = "single_duel")]
		{
			#block
		}
	});

	TokenStream::from(quote!(#function))
}

#[proc_macro_attribute]
pub fn plugin (_attr: TokenStream, item: TokenStream) -> TokenStream {
	let mut function: ItemFn = parse_macro_input!(item as ItemFn);
	let block: Box<Block> = function.block;

	function.attrs.push(parse_quote!(#[allow(unused_variables)]));
	function.block = parse_quote!({
		#[cfg(not(feature = "plugin"))]
		{
			Err(String::from("plugin is forbidden by features"))
		}

		#[cfg(feature = "plugin")]
		{
			#block
		}
	});

	TokenStream::from(quote!(#function))
}
