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
		button.style.marginLeft = "5px"
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
		field.className = "field"
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
		select_button.innerHTML = "str"
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
		this.shadow_dom.innerHTML = ""
		this.item = item

		const header = document.createElement("div")
		header.style.minHeight = "50px"
		header.appendChild(this.input_template)
		this.shadow_dom.appendChild(header)

		const create_button = document.createElement("button")
		create_button.style.marginTop = "3px"
		create_button.style.marginBottom = "3px"
		create_button.textContent = "Create"
		create_button.onclick = this.create_button
		header.appendChild(create_button)

		const seperator = document.createElement("div")
		seperator.style.background = "black"
		seperator.style.height = "4px"
		this.shadow_dom.appendChild(seperator)

		const main = document.createElement("div")
		main.className = "main"
		main.addEventListener("click", (e) => {
			if (e.target.id == "select_button") {
				if (e.target.parentNode.state == "raw") {
					e.target.textContent = "str"
					e.target.parentNode.state = "str"

					const [val] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "val")
					val.textContent = this.item.fields[e.target.parentNode.field_num].val

				} else if (e.target.parentNode.state == "str") {
					e.target.textContent = "number"
					e.target.parentNode.state = "number"

					const [val] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "val")
					val.textContent = this.item.fields[e.target.parentNode.field_num].val_as_number

				} else if (e.target.parentNode.state == "number") {
					e.target.textContent = "raw"
					e.target.parentNode.state = "raw"

					const [val] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "val")
					val.textContent = this.item.fields[e.target.parentNode.field_num].val_raw
				}
			}
		})
		//this.shadow_dom.innerHTML = ""
		this.shadow_dom.appendChild(main)

		let field_num = 0
		for (let field of item.fields){
			const field_element = this.field_element.cloneNode(true)

			const [val] = Array.from(field_element.childNodes).filter( node => node.id == "val")
			const [key] = Array.from(field_element.childNodes).filter( node => node.id == "key")

			key.textContent = field.key
			//I want commit to show as a number
			if (field.key == "_commit"){
				val.textContent = field.val_as_number
				field_element.state = "number"
				let [select_button] = Array.from(field_element.childNodes).filter( el => el.id == "select_button")
				select_button.textContent = "number"
			} else {
				val.textContent = field.val
				field_element.state = "str"
			}

			const update_input = document.createElement("input")
			update_input.style.marginLeft = "5px"
			field_element.appendChild(update_input)
			const update_button = document.createElement("button")
			update_button.onclick = this.update_button
			update_button.textContent = "Update"
			update_button.style.marginLeft = "2px"
			field_element.appendChild(update_button)

			field_element.field_num = field_num

			main.appendChild(field_element)
			main.appendChild(document.createElement("br"))

			field_num += 1
		}
	}

	updatedItemCallback(new_item){
		console.log("Update")
	}

	update_button(e){
		const component_this = e.target.parentNode.parentNode.parentNode.host

		const ar = Array.from(e.target.parentNode.childNodes)
		const [input] = ar.filter( node => node.tagName == "INPUT")
		const [key] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "key")
		const [val_element] = Array.from(e.target.parentNode.childNodes).filter( node => node.id == "val")
		const field = component_this.item.fields[val_element.parentNode.field_num].val_raw

		let answer = [1,8,
			...u64_to_be_bytes(component_this.item.id),

			//num_of_updates
			...u32_to_be_bytes(1),

			//should repeat
			...u32_to_be_bytes(key.textContent.length),
			...mize.encoder.encode(key.textContent),

			//update len
			...u32_to_be_bytes(9 + input.value.length + 9),

			//### update one: delete everything
			//update cmd
			2,
			//start
			...u32_to_be_bytes(0),
			//stop
			...u32_to_be_bytes(field.length),

			//### update two: add everything

			//update cmd
			1,
			//start
			...u32_to_be_bytes(0),
			//stop
			...u32_to_be_bytes(input.value.length),

			...mize.encoder.encode(input.value),
			
		]
		component_this.so.send(new Uint8Array(answer))

	}

	create_button(e){
		const component_this = e.target.parentNode.parentNode.host

		const input_div = component_this.shadow_dom.getElementById("create-input")
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
			const key_bytes = mize.encoder.encode(field[0])
			const val_bytes = mize.encoder.encode(field[1])
			//pr(this.encoder.encode(field[0]))
			answer = [...answer, ...Array.from(u32_to_be_bytes(key_bytes.length))]
			answer = [...answer, ...key_bytes]
			
			answer = [...answer, ...Array.from(u32_to_be_bytes(val_bytes.length))]
			answer = [...answer, ...val_bytes]
			
		}
		pr(answer)

		component_this.so.send(new Uint8Array(answer))
	}
}
