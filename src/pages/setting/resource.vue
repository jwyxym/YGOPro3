<template>
	<div class = 'resource no-scrollbar' v-if = '!i18n'>
		<div class = 'avatar'>
			<h4>{{ mainGame.get.text(I18N_KEYS.SETTING_AVATAR_SELF) }}</h4>
			<RecycleScroller
				class = 'horizontal'
				keyField = 'index'
				:items = 'mainGame.avatars'
				:item-size = '120'
				direction = 'horizontal'
			>
				<template v-slot = '{ item, index }'>
					<var-avatar
						@click = 'page.avatar.select(0, index)'
						:class = "{ 'select' : page.avatar.self === index }"
						:src = 'item'
						:size = '78'
					/>
				</template>
			</RecycleScroller>
		</div>
		<div class = 'avatar'>
			<h4>{{ mainGame.get.text(I18N_KEYS.SETTING_AVATAR_OPPO) }}</h4>
			<RecycleScroller
				class = 'horizontal'
				keyField = 'index'
				:items = 'mainGame.avatars'
				:item-size = '120'
				direction = 'horizontal'
			>
				<template v-slot = '{ item, index }'>
					<var-avatar
						@click = 'page.avatar.select(1, index)'
						:class = "{ 'select' : page.avatar.oppo === index }"
						:src = 'item'
						:size = '78'
					/>
				</template>
			</RecycleScroller>
		</div>
		<div class = 'avatar'>
			<h4>{{ mainGame.get.text(I18N_KEYS.SETTING_AVATAR_SERVER) }}</h4>
			<RecycleScroller
				class = 'horizontal'
				keyField = 'index'
				:items = 'mainGame.avatars'
				:item-size = '120'
				direction = 'horizontal'
			>
				<template v-slot = '{ item, index }'>
					<var-avatar
						@click = 'page.avatar.select(2, index)'
						:class = "{ 'select' : page.avatar.server === index }"
						:src = 'item'
						:size = '78'
					/>
				</template>
			</RecycleScroller>
		</div>
		<div class = 'avatar'>
			<h4>{{ mainGame.get.text(I18N_KEYS.SETTING_AVATAR_WATCHER) }}</h4>
			<RecycleScroller
				class = 'horizontal'
				keyField = 'index'
				:items = 'mainGame.avatars'
				:item-size = '120'
				direction = 'horizontal'
			>
				<template v-slot = '{ item, index }'>
					<var-avatar
						@click = 'page.avatar.select(3, index)'
						:class = "{ 'select' : page.avatar.watcher === index }"
						:src = 'item'
						:size = '78'
					/>
				</template>
			</RecycleScroller>
		</div>
	</div>
</template>
<script setup lang = 'ts'>
	import { reactive } from 'vue';
	import { RecycleScroller } from 'vue-virtual-scroller';

	import mainGame from '@/script/game';
	import { KEYS } from '@/script/constant';
	import { I18N_KEYS } from '@/script/language/i18n';

	const page = reactive({
		avatar : {
			self : mainGame.get.system(KEYS.SETTING_AVATAR_SELF) as number,
			oppo : mainGame.get.system(KEYS.SETTING_AVATAR_OPPO) as number,
			server : mainGame.get.system(KEYS.SETTING_AVATAR_SERVER) as number,
			watcher : mainGame.get.system(KEYS.SETTING_AVATAR_WATCHER) as number,
			select : async (i : 0 | 1 | 2 | 3, v : number) => {
				switch (i) {
					case 0:
						page.avatar.self = v;
						await mainGame.set.system(KEYS.SETTING_AVATAR_SELF, v);
						break;
					case 1:
						page.avatar.oppo = v;
						await mainGame.set.system(KEYS.SETTING_AVATAR_OPPO, v);
						break;
					case 2:
						page.avatar.server = v;
						await mainGame.set.system(KEYS.SETTING_AVATAR_SERVER, v);
						break;
					case 3:
						page.avatar.watcher = v;
						await mainGame.set.system(KEYS.SETTING_AVATAR_WATCHER, v);
						break;
				}
			}
		}
	});

	const props = defineProps<{
		i18n : boolean
	}>();
</script>
<style scoped lang = 'scss'>
	.resource {
		height: 100%;
		width: 100%;
		overflow-y: auto;
		> div {
			width: 100%;
			border-bottom: 1px solid white;
		}
		.avatar {
			height: 150px;
			> div {
				width: 100%;
				height: 100px;
				.select {
					outline: 2px solid yellow;
				}
			}
		}
		
	}
</style>