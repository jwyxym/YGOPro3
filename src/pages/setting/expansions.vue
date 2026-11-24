<template>
	<div
		class = 'expansions no-scrollbar'
		:style = "{ '--ct' : (setting.versions.length + setting.reload.length + 1).toString()}"
		v-if = '!i18n'
	>
		<var-cell
			v-for = "i in setting.versions"
			:title = 'mainGame.get.text(i.title)'
		>
			<template #extra>
				<var-icon name = 'information-outline' v-if = 'i.loading === undefined' @click = 'i.chk'/>
				<var-loading color = 'white' v-else-if = "i.loading === 'loading'" class = 'setting__loading'/>
				<div
					class = 'result'
					v-show = "typeof i.loading === 'boolean'"
					@click = 'i.update'
				>
					<span>{{ mainGame.get.text(i.loading ? I18N_KEYS.SETTING_LATEST : I18N_KEYS.SETTING_UPDATE) }}</span>
					<var-badge color = 'chartreuse' dot v-if = 'i.loading'/>
					<var-badge type = 'danger' dot v-else/>
				</div>
			</template>
		</var-cell>
		<var-cell
			v-for = "i in setting.reload"
			:title = 'mainGame.get.text(i.title)'
		>
			<template #extra>
				<var-loading color = 'white' v-if = 'loading' class = 'setting__loading'/>
				<var-icon
					v-else
					name = 'refresh'
					@click = 'i.click'
				/>
			</template>
		</var-cell>
		<var-cell class = 'downloading-cell'>
			<template #default>
				<div class = 'downloading'>
					<div>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_CUSTOM)'
							v-model = 'setting.download.url'
							:rules = 'setting.download.rule.url'
						/>
					</div>
					<div>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_NAME)'
							v-model = 'setting.download.name'
							:rules = 'setting.download.rule.name'
						/>
					</div>
					<div>
						<Input
							:placeholder = 'mainGame.get.text(I18N_KEYS.SETTING_DOWNLOAD_CHUNK)'
							v-model = 'setting.download.chunk'
							:rules = 'setting.download.rule.chunk'
						/>
					</div>
				</div>
			</template>
			<template #extra>
				<var-loading color = 'white' v-if = 'loading' class = 'setting__loading'/>
				<var-icon
					v-else
					name = 'arrow-down'
					@click = 'setting.download.start()'
				/>
			</template>
		</var-cell>
		<var-divider :description = 'mainGame.get.text(I18N_KEYS.SETTING_EX_CARDS)'/>
		<var-checkbox-group v-model = 'setting.loaded_expansion'>
			<var-loading :loading = 'loading'>
				<TransitionGroup
					name = 'opacity'
					tag = 'div'
					class = 'no-scrollbar'
				>
					<var-cell
						v-for = '(i, v) in setting.expansion'
						:key = 'i'
						:title = 'i'
						@dblclick = 'setting.delete(v)'
					>
						<template #extra>
							<var-checkbox
								:checked-value = 'i'
								@change = 'setting.change($event, v)'
							></var-checkbox>
							<var-icon name = 'trash-can-outline' @click = 'setting.delete(v)'/>
						</template>
					</var-cell>
				</TransitionGroup>
			</var-loading>
		</var-checkbox-group>
	</div>
</template>
<script setup lang = 'ts'>
	import { onBeforeMount } from 'vue';

	import mainGame from '@/script/game';
	import invoke from '@/script/invoke';
	import { I18N_KEYS } from '@/script/language/i18n';
	import { KEYS } from '@/script/constant';
	import Input from '@/ui/input.vue';

	import setting from './setting';

	onBeforeMount(async () => {
		setting.expansion = await invoke.ypk.load() as Array<string>;
		setting.loaded_expansion = mainGame.get.system(KEYS.SETTING_LOADING_EXPANSION) as Array<string>;
	});

	const props = defineProps<{
		loading : boolean,
		i18n : boolean
	}>();
</script>
<style scoped lang = 'scss'>
	.expansions {
		height: 100%;
		width: 100%;
		overflow-y: auto;
		[media = 'mobile'] & {
			:deep(.setting__loading){
				gap: 150px !important;
			}
			> .downloading-cell {
				height: 280px !important;
			}
		}
		.var-cell {
			.downloading {
				width: 750px;
				display: flex;
				flex-direction: column;
				> div {
					height: 80px;
					width: 100%;
					.var-input {
						width: 350px;
					}
				}
			}
			:deep(.var-cell__extra) {
				display: flex;
				height: 40px;
				.result {
					width: 200px;
					position: relative;
					display: flex;
					justify-content: right;
					align-items: center;
				}
			}
		}
		.var-checkbox-group {
			height: calc(100% - 50px * (var(--ct) + 3));
			width: 100%;
			> div {
				height: 100%;
				width: 100%;
				> div {
					height: 100%;
					width: 100%;
					overflow-y: auto;
					> div {
						width: calc(100% - 20px);
					}
				}
			}
		}
	}
</style>