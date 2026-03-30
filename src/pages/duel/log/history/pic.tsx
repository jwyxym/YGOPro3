import { defineComponent } from 'vue';
import { POS } from '@/pages/duel/ygo-protocol/network';

const Pic  = defineComponent({
	props: {
		src : {
			type : String,
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
			<img src = {props.src} style = {{
				'height' : '80%',
				'transform' : props.pos & POS.DEFENSE ? 'rotate(-90deg)' : 'initial'
			}}/>
		</div>;
	},
});

export default Pic;