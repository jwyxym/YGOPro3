import { defineComponent } from 'vue';
import mainGame from '@/script/game';
import { KEYS } from '@/script/constant';

const Pic  = defineComponent({
	setup () {
		return () => <div style = {{
			'display' : 'flex',
			'flex-direction' : 'column',
			'align-items' : 'center',
			'justify-content' : 'center'
		}}>
			<img
				src = {mainGame.get.textures(KEYS.OTHER, KEYS.COVER) as string}
				style = {{
					'height' : '80%',
				}}
			/>
		</div>;
	},
});

export default Pic;