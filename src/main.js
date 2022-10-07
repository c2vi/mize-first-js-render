export class First extends HTMLElement {
	constructor(){
		super()
		this.shadow_dom = this.attachShadow({ mode: "open"})
	}

		
	connectedCallback(){
		this.render_func()
	}


	async render_func() {
		this.shadow_dom.innerHTML = `
			<button>RENDER</button>
		`
	}
	update(mize_update){
		console.log("Update: " + mize_update)
	}
}
