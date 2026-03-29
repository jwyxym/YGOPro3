import { defineComponent, PropType } from 'vue';

const Cards  = defineComponent({
	props: {
		cards : {
			type : Array as PropType<string[]>,
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
				const width = 100 / 1.45;
				const gap = props.width / props.cards.length;
				console.log(width, gap)
				return <img src = {i} style = {{
					'position' : 'absolute',
					'height' : 'calc(100% - 30px)',
					'left' : '0',
					'top' : '50%',
					'transform' : `translate(calc(${width * props.cards.length > props.width ? gap : width}px * ${v}), -50%)`
				}}/>
			})}
		</div>
	},
});

export default Cards;