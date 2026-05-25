import api from "../utils/api"
import { toJSON, toJSONList, toXML } from "../xml/productOptionValueXML"
import ProductOption from "./ProductOption"

const toList = (value) => {
	if (Array.isArray(value)) return value
	if (value instanceof Set) return Array.from(value)
	return [value]
}

class ProductOptionValue {
	endpoint = "product_option_values"

	constructor(xml, validate = true) {
		const data = toJSON(xml) || {}

		this.id = data.id ?? null
		this.idAttributeGroup = data.idAttributeGroup ?? null
		this.color = data.color ?? ""
		this.position = data.position ?? null
		this.name = data.name ?? []

		if (validate) {
			const missing = []
			const hasName =
				Array.isArray(this.name) &&
				this.name.some((lang) => (lang?.value ?? "").trim() !== "")

			if (this.idAttributeGroup == null) {
				missing.push("idAttributeGroup")
			}

			if (!hasName) {
				missing.push("name")
			}

			if (missing.length > 0) {
				throw new Error(`Missing required fields: ${missing.join(", ")}`)
			}
		}
	}

	static fromJSON(JsonData, validate = true) {
		return new ProductOptionValue(toXML(JsonData), validate)
	}

	static fromData(data) {
		const value = Object.create(ProductOptionValue.prototype)
		Object.assign(value, data)
		value.endpoint = ProductOptionValue.prototype.endpoint ?? "product_option_values"
		return value
	}

	async save() {
		const xml = await api.post(this.endpoint, toXML(this))
		return new ProductOptionValue(xml)
	}

	async getById(id) {
		const xml = await api.get(`${this.endpoint}/${id}`)
		return new ProductOptionValue(xml)
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
			throw new Error("Cannot update a product option value without an ID")
		}

		const xml = await api.put(`${this.endpoint}/${this.id}`, toXML(this))
		return new ProductOptionValue(xml)
	}

	async delete() {
		if (!this.id) {
			throw new Error("Cannot delete a product option value without an ID")
		}

		await api.delete(`${this.endpoint}/${this.id}`)
	}

	async getAll() {
		const xml = await api.get(`${this.endpoint}?display=full`)
		const values = toJSONList(xml)
		return values.map((valueData) => new ProductOptionValue(toXML(valueData)))
	}

	async getAllApi(excludeIds = []) {
		const ids = (excludeIds ?? []).map(Number).filter(Number.isFinite)
		let endpoint = `${this.endpoint}?display=full`
		if (ids.length > 0) {
			endpoint += `&filter[id]=![${ids.join("|")}]`
		}
		const xml = await api.get(endpoint)
		const values = toJSONList(xml)
		return values.map((valueData) => new ProductOptionValue(toXML(valueData)))
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
		const ids = (excludeIds ?? []).map(Number).filter(Number.isFinite)
		let endpoint = `${this.endpoint}?display=full`
		if (ids.length > 0) {
			endpoint += `&filter[id]=![${ids.join("|")}]`
		}
		const xml = await api.get(endpoint)
		const values = toJSONList(xml)
		return values.map((valueData) => ProductOptionValue.fromData(valueData))
	}

	async getInclApi(includeIds = []) {
		const ids = (includeIds ?? []).map(Number).filter(Number.isFinite)
		let endpoint = `${this.endpoint}?display=full`
		if (ids.length > 0) {
			endpoint += `&filter[id]=[${ids.join("|")}]`
		}
		const xml = await api.get(endpoint)
		const values = toJSONList(xml)
		return values.map((valueData) => ProductOptionValue.fromData(valueData))
	}

	async getByApi(fieldName, value = this[fieldName]) {
		const normalized = toList(value).map(String).map((v) => v.trim()).filter((s) => s !== "")

		if (normalized.length === 0) return []

		let endpoint = `${this.endpoint}?display=full`
		endpoint += `&filter[${fieldName}]=[${normalized.join("|")}]`
		const xml = await api.get(endpoint)
		const valuesList = toJSONList(xml)
		return valuesList.map((valueData) => ProductOptionValue.fromData(valueData))
	}

	async getByNotApi(fieldName, value = this[fieldName]) {
		const normalized = toList(value).map(String).map((v) => v.trim()).filter((s) => s !== "")

		if (normalized.length === 0) return []

		let endpoint = `${this.endpoint}?display=full`
		endpoint += `&filter[${fieldName}]=![${normalized.join("|")}]`
		const xml = await api.get(endpoint)
		const valuesList = toJSONList(xml)
		return valuesList.map((valueData) => ProductOptionValue.fromData(valueData))
	}

    async getProductOption() {
        const productOption = new ProductOption({}, false);
        return await productOption.getById(this.idAttributeGroup);
    }
}

export default ProductOptionValue
