import { defineComponent } from 'vue';

const Pic  = defineComponent({
	props: {
		src : {
			type : String,
			required : true
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
				'height' : '80%'
			}}/>
		</div>;
	},
});

export default Pic;