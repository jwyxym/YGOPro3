import mainGame from '@/script/game';
import { defineComponent, PropType } from 'vue';

const Cards  = defineComponent({
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
	setup (props) {
		return () => <div style = {{
			'position' : 'relative',
		}}>
			{props.cards.map((i, v) => {
				const width = 50 / 1.45;
				const gap = props.width / props.cards.length;
				return <img
					class = 'history__card__pic'
					src = {mainGame.get.card(i).pic}
					id = {`${i}`}
					style = {{
						'position' : 'absolute',
						'height' : 'calc(100% - 30px)',
						'left' : '0',
						'top' : '50%',
						'transform' : `translate(calc(${width * props.cards.length > props.width ? gap : width}px * ${v}), -50%)`
					}}
				/>
			})}
		</div>
	},
});

export default Cards;