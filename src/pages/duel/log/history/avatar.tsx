import { defineComponent } from 'vue';

const Avatar  = defineComponent({
	props: {
		avatar : {
			type : String,
			required : true
		},
		self : {
			type : Boolean,
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
			<div style = {{
				'width' : '100%',
				'height' : '80%',
				'display' : 'flex',
				'align-items' : 'center',
				'justify-content' : 'center'
			}}>
				<var-avatar
					src = {props.avatar}
					bordered = {true}
					border-color = {props.self ? 'blue' : 'red'}
					size = {70}
				/>
			</div>
		</div>;
	},
});

export default Avatar;