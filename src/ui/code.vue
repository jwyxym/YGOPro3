<template>
	<div class = 'code'>
		<textarea
			ref = 'input'
			v-show = 'page.input'
			v-model = 'page.code'
			@blur = 'page.blur()'
		/>
		<var-highlighter-provider
			v-show = '!page.input'
			:highlighter = 'style'
			@click = 'page.focus()'
		>
			<var-code
				language = 'javascript'
				:code = 'page.code'
				:word-wrap = 'true'
				:trim = 'false'
			/>
		</var-highlighter-provider>
	</div>
</template>
<script setup lang = 'ts'>
	import { computed, nextTick, reactive, useTemplateRef } from 'vue';
	import hljs from 'highlight.js/lib/core';
	import javascript from 'highlight.js/lib/languages/javascript';
	
	const input = useTemplateRef<HTMLTextAreaElement>('input');

	hljs.registerLanguage('javascript', javascript);

	const style = {
		codeToHtml : async (code : string) => {
			return `<pre>
					<code class = 'hljs'>${
						hljs.highlight(code, { language : 'javascript' }).value
					}</code>
				</pre>`;
		}
	};

	const emit = defineEmits<{
		blur : [];
		'update:modelValue' : [v : string];
	}>();

	const props = defineProps<{
		modelValue : string;
		readonly ?: boolean;
	}>();

	const page = reactive({
		code : computed({
			get : () => props.modelValue,
			set : (v ?: string) => emit('update:modelValue', v ?? '')
		}),
		input : false,
		focus : async function () {
			if (props.readonly)
				return;
			this.input = true;
			await nextTick()
			input.value?.focus?.();
		},
		blur : function () {
			this.input = false;
			emit('blur');
		}
	});
</script>
<style scoped lang = 'scss'>
	.code {
		height: 100%;
		width: 100%;
		border: 1px solid white;
		.var-highlighter-provider {
			height: 100%;
			width: 100%;
			[media = 'pc'] & {
				--code-font-size: 16px !important;
			}
			[media = 'mobile'] & {
				--code-font-size: 32px !important;
			}
		}
		textarea {
			color: white;
			resize: none;
			background-color: transparent;
			height: 100%;
			width: 100%;
			[media = 'pc'] & {
				font-size: 16px;
			}
			[media = 'mobile'] & {
				font-size: 32px;
			}
		}
	}
</style>