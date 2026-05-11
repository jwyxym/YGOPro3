import mainGame from '@/script/game';
import { defineComponent, PropType } from 'vue';

const Cards  = defineComponent({
	emits : {
		click : (_ : number | string) => true
	},
	props: {
		cards : {
			type : Array as PropType<Array<string | number>>,
			required : true
		},
		width : {
			type : Number,
			required : true
		}
	},
	setup (props, { emit }) {
		return () => <div style = {{
			'position' : 'relative',
		}}>
			{props.cards.map((i, v) => {
				const width = 50 / 1.45;
				const gap = props.width / props.cards.length;
				return <img
					src = {i ?  mainGame.get.card(i).pic : mainGame.back.pic}
					style = {{
						'position' : 'absolute',
						'height' : 'calc(100% - 30px)',
						'left' : '0',
						'top' : '50%',
						'transform' : `translate(calc(${width * props.cards.length > props.width ? gap : width}px * ${v}), -50%)`
					}}
					onClick = {(e : MouseEvent) => {
						emit('click', i);
						e.stopPropagation();
					}}
				/>
			})}
		</div>
	},
});

export default Cards;