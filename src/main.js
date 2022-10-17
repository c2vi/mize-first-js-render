export class First extends HTMLElement {
	constructor(){
		super()
		this.encoder = new TextEncoder()
		this.shadow_dom = this.attachShadow({ mode: "open"})

		// input template
		const input = document.createElement("div")
		input.id = "create-input"
		input.appendChild(document.createElement("input"))
		input.appendChild(document.createElement("input"))
		const button = document.createElement("button")
		button.onclick = (e) => {
			input.insertBefore(document.createElement("br"), button)
			input.insertBefore(document.createElement("input"), button)
			input.insertBefore(document.createElement("input"), button)
		}
		button.textContent = "Add Field"

		input.appendChild(button)
		this.input_template = input

		// field template
		const field = document.createElement("div")
		field.style.display = "block"

		const key = document.createElement("span")
		key.id = "key"
		field.appendChild(key)

		field.appendChild(document.createElement("br"))

		const val = document.createElement("span")
		val.id = "val"
		field.appendChild(val)

		const spacer = document.createElement("div")
		//spacer.style.background = "red"
		spacer.style.width = "20px"
		spacer.style.height = "5px"
		field.appendChild(spacer)

		const select_button = document.createElement("button")
		select_button.id = "select_button"
		select_button.innerHTML = "u8"
		select_button.style.verticalAlign = "left"
		field.appendChild(select_button)

		field.class = "field"
		field.style.border = "4px solid"
		field.style.padding = "10px"
		field.style.margin = "10px"
		this.field_element = field
	}

		
	connectedCallback(){
		this.render_func()
	}


	async render_func() {
		this.shadow_dom.innerHTM = `
			LOADING	
		`
	}

	getItemCallback(item) {
		this.item = item

		const header = document.createElement("div")
		header.style.minHeight = "50px"
		header.appendChild(this.input_template)
		this.shadow_dom.appendChild(header)

		const create_button = document.createElement("button")
		create_button.textContent = "Create"
		create_button.onclick = (e) => {
			const input_div = this.shadow_dom.getElementById("create-input")
			let item = []

			let key = null
			for (let field of input_div.childNodes) {
				if (field.tagName == "INPUT") {
					if (key == null) {
						key = field.value
					} else {
						item.push([key, field.value])
						key = null
					}
				}
			}
			let answer = [1,12,]

			answer = [...answer, ...Array.from(u32_to_be_bytes(item.length))]

			for (let field of item){
				//pr(this.encoder.encode(field[0]))
				answer = [...answer, ...Array.from(u32_to_be_bytes(field[0].length))]
				answer = [...answer, ...this.encoder.encode(field[0])]
				
				answer = [...answer, ...Array.from(u32_to_be_bytes(field[1].length))]
				answer = [...answer, ...this.encoder.encode(field[1])]
				
			}
			pr(answer)

			this.so.send(new Uint8Array(answer))
		}
		header.appendChild(create_button)

		const seperator = document.createElement("div")
		seperator.style.background = "black"
		seperator.style.height = "4px"
		this.shadow_dom.appendChild(seperator)

		const main = document.createElement("div")
		main.addEventListener("click", (e) => {
			if (e.target.id == "select_button") {
				if (e.target.parentNode.state == "u8") {
					e.target.textContent = "str"
					e.target.parentNode.state = "str"

					const [val] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "val")
					val.textContent = this.item.str[e.target.parentNode.field_num][1]

				} else if (e.target.parentNode.state == "str") {
					e.target.textContent = "u64"
					e.target.parentNode.state = "u64"

					const u64 = from_be_bytes(this.item.u8[e.target.parentNode.field_num][1])
					const [val] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "val")
					val.textContent = u64
				} else if (e.target.parentNode.state == "u64") {
					e.target.textContent = "u8"
					e.target.parentNode.state = "u8"

					const [val] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "val")

					val.textContent = this.item.u8[e.target.parentNode.field_num][1]
				}
			}
		})
		//this.shadow_dom.innerHTML = ""
		this.shadow_dom.appendChild(main)
		let field_num = 0
		for (i of item.u8){
			const field = this.field_element.cloneNode(true)
			const [val] = Array.from(field.childNodes).filter( node => node.id == "val")
			const [key] = Array.from(field.childNodes).filter( node => node.id == "key")
			key.textContent = this.item.str[field_num][0]
			val.textContent = i[1]
			field.field_num = field_num
			field.state = "u8"

			main.appendChild(field)
			main.appendChild(document.createElement("br"))

			field_num += 1
		}
	}

	updatedItemCallback(mize_update){
		console.log("Update")
	}
}
