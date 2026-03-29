import { defineComponent } from 'vue';

const Desc  = defineComponent({
	props: {
		desc : {
			type : String,
			required : true
		},
		position : {
			type : Boolean,
			default : false
		}
	},
	setup (props) {
		return () => <div style = {{
			'display' : 'flex',
			'justify-content' : props.position ? 'flex-start' : 'center',
			'align-items' : 'center',
			'white-space' : 'pre-wrap'
		}}>
			<b>{props.desc}</b>
		</div>;
	},
});

export default Desc;