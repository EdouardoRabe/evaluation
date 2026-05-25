import api from "../utils/api"
import { toJSON, toJSONList, toXML } from "../xml/productOptionXML"

const toList = (value) => {
	if (Array.isArray(value)) return value
	if (value instanceof Set) return Array.from(value)
	return [value]
}

class ProductOption {
	endpoint = "product_options"

	constructor(xml, validate = true) {
		const data = toJSON(xml) || {}

		this.id = data.id ?? null
		this.isColorGroup = data.isColorGroup ?? null
		this.groupType = data.groupType ?? ""
		this.position = data.position ?? null
		this.name = data.name ?? []
		this.publicName = data.publicName ?? []
		this.associations = data.associations ?? {
			productOptionValues: [],
		}

		if (validate) {
			const missing = []
			const hasName =
				Array.isArray(this.name) &&
				this.name.some((lang) => (lang?.value ?? "").trim() !== "")
			const hasPublicName =
				Array.isArray(this.publicName) &&
				this.publicName.some((lang) => (lang?.value ?? "").trim() !== "")

			if (!this.groupType) {
				missing.push("groupType")
			}

			if (!hasName) {
				missing.push("name")
			}

			if (!hasPublicName) {
				missing.push("publicName")
			}

			if (missing.length > 0) {
				throw new Error(`Missing required fields: ${missing.join(", ")}`)
			}
		}
	}

	static fromJSON(JsonData, validate = true) {
		return new ProductOption(toXML(JsonData), validate)
	}

	static fromData(data) {
		const option = Object.create(ProductOption.prototype)
		Object.assign(option, data)
		option.endpoint = ProductOption.prototype.endpoint ?? "product_options"
		return option
	}

	async save() {
		const xml = await api.post(this.endpoint, toXML(this))
		return new ProductOption(xml)
	}

	async getById(id) {
		const xml = await api.get(`${this.endpoint}/${id}`)
		return new ProductOption(xml)
	}

	async getBy(fieldName, value = this[fieldName]) {
		if (value === undefined || value === null || value === "") return []
		const all = await this.getAll()
		const normalized = new Set(toList(value).map(String))

		return all.filter((item) => {
			const v = item[fieldName]
			if (v === undefined || v === null) return false
			if (Array.isArray(v)) return v.map(String).some((iv) => normalized.has(iv))
			return normalized.has(String(v))
		})
	}

	async update() {
		if (!this.id) {
			throw new Error("Cannot update a product option without an ID")
		}

		const xml = await api.put(`${this.endpoint}/${this.id}`, toXML(this))
		return new ProductOption(xml)
	}

	async delete() {
		if (!this.id) {
			throw new Error("Cannot delete a product option without an ID")
		}

		await api.delete(`${this.endpoint}/${this.id}`)
	}

	async getAll() {
		const xml = await api.get(`${this.endpoint}?display=full`)
		const options = toJSONList(xml)
		return options.map((optionData) => new ProductOption(toXML(optionData)))
	}

	async getAllApi(excludeIds = []) {
		const ids = (excludeIds ?? []).map(Number).filter(Number.isFinite)
		const filter = ids.length > 0 ? `&filter[id]=![${ids.join("|")}]` : ""
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const options = toJSONList(xml)
		return options.map((optionData) => new ProductOption(toXML(optionData)))
	}

	async getByNot(fieldName, value = this[fieldName]) {
		if (value === undefined || value === null || value === "") return await this.getAll()
		const all = await this.getAll()
		const normalized = new Set(toList(value).map(String))

		return all.filter((item) => {
			const v = item[fieldName]
			if (v === undefined || v === null) return true
			if (Array.isArray(v)) return !v.map(String).some((iv) => normalized.has(iv))
			return !normalized.has(String(v))
		})
	}

	async getExcl(excludeIds = []) {
		const excluded = new Set((excludeIds ?? []).map(Number))
		const all = await this.getAll()
		return all.filter((item) => !excluded.has(Number(item.id)))
	}

	async getIncl(includeIds = []) {
		const included = new Set((includeIds ?? []).map(Number))
		const all = await this.getAll()
		return all.filter((item) => included.has(Number(item.id)))
	}

	async getExclApi(excludeIds = []) {
		const excluded = new Set((excludeIds ?? []).map(Number))
		const options = await this.getAllApi(excludeIds)
		return options.filter((item) => !excluded.has(Number(item.id)))
	}

	async getInclApi(includeIds = []) {
		const ids = (includeIds ?? []).map(Number).filter(Number.isFinite)
		const filter = ids.length > 0 ? `&filter[id]=[${ids.join("|")}]` : ""
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const options = toJSONList(xml)
		return options.map((optionData) => new ProductOption(toXML(optionData)))
	}

	async getByApi(fieldName, value = this[fieldName]) {
		const normalized = toList(value).map(String).map((v) => v.trim()).filter((s) => s !== "")

		if (normalized.length === 0) return []

		const filter = `&filter[${fieldName}]=[${normalized.join("|")}]`
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const options = toJSONList(xml)
		return options.map((optionData) => new ProductOption(toXML(optionData)))
	}

	async getByNotApi(fieldName, value = this[fieldName]) {
		const normalized = toList(value).map(String).map((v) => v.trim()).filter((s) => s !== "")

		if (normalized.length === 0) return []

		const filter = `&filter[${fieldName}]=![${normalized.join("|")}]`
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const options = toJSONList(xml)
		return options.map((optionData) => new ProductOption(toXML(optionData)))
	}
}

export default ProductOption
