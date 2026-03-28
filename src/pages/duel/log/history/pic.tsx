import { defineComponent } from 'vue';

const Pic  = defineComponent({
	props: {
		src : {
			type : String
		},
		desc : {
			type : String
		},
	},
	setup (props) {
		return () => <div style = {{
			'display' : 'flex',
			'flex-direction' : 'column',
			'align-items' : 'center',
			'justify-content' : 'center'
		}}>
			<img src = {props.src} style = {{
				'height' : 'calc(100% - 30px)'
			}}/>
			<div style = {{
				'width' : '100%',
				'height' : '20px',
				'white-space' : 'nowrap',
				'overflow' : 'hidden',
				'text-overflow' : 'ellipsis'
			}}>
				<span>{props.desc}</span>
			</div>
		</div>;
	},
});

export default Pic;