<template>
	<var-cell>
		<template #icon>
			<var-icon
				:name = "show ? 'chevron-down' : 'chevron-right'"
				transition = '200'
				:size = '30'
				@click = "emit('update:show', !show)"
			/>
		</template>
		<template #default>
			<div
				@click = "emit('update:show', !show)"
			>
				{{ title }}
			</div>
		</template>
		<template #extra>
			<var-icon
				v-if = 'icon'
				name = 'close-circle-outline'
				@click = "emit('off')"
			/>
		</template>
	</var-cell>
</template>
<script setup lang = 'ts'>
	const props = defineProps<{
		show : boolean;
		title : string;
		icon : boolean;
	}>();

	const emit = defineEmits<{
		'update:show' : [boolean];
		off : [];
	}>();

</script>