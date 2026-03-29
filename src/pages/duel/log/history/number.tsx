import { defineComponent } from 'vue';

const Num  = defineComponent({
	props: {
		number : {
			type : [Number, String],
			required : true
		}
	},
	setup (props) {
		return () => <div style = {{
			'display' : 'flex',
			'align-items' : 'center',
			'justify-content' : 'center',
			'font-size' : '2em'
		}}>
			<b>{props.number}</b>
		</div>;
	},
});

export default Num;