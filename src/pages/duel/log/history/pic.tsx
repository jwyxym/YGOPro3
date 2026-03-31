import { defineComponent, PropType } from 'vue';
import { POS } from '@/pages/duel/ygo-protocol/network';
import mainGame from '@/script/game';

const Pic  = defineComponent({
	props: {
		id : {
			type : [String, Number] as PropType<string | number>,
			required : true
		},
		pos : {
			type : Number,
			default : POS.ATTACK
		}
	},
	setup (props) {
		return () => <div style = {{
			'display' : 'flex',
			'flex-direction' : 'column',
			'align-items' : 'center',
			'justify-content' : 'center'
		}}>
			<img
				class = 'history__card__pic'
				id = {`${props.id}`}
				src = {mainGame.get.card(props.id).pic}
				style = {{
					'height' : '80%',
					'transform' : props.pos & POS.DEFENSE ? 'rotate(-90deg)' : 'initial'
				}}
			/>
		</div>;
	},
});

export default Pic;