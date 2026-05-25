import api from "../utils/api"
import { toJSON, toJSONList, toXML } from "../xml/carrierXML"

const toList = (value) => {
	if (Array.isArray(value)) return value
	if (value instanceof Set) return Array.from(value)
	return [value]
}

class Carrier {
	endpoint = "carriers"

	constructor(xml, validate = true) {
		const data = toJSON(xml) || {}

		this.id = data.id ?? null
		this.deleted = data.deleted ?? 0
		this.isModule = data.isModule ?? false
		this.idTaxRulesGroup = data.idTaxRulesGroup ?? null
		this.idReference = data.idReference ?? null
		this.name = data.name ?? ""
		this.active = data.active ?? true
		this.isFree = data.isFree ?? false
		this.url = data.url ?? ""
		this.shippingHandling = data.shippingHandling ?? false
		this.shippingExternal = data.shippingExternal ?? false
		this.rangeBehavior = data.rangeBehavior ?? false
		this.shippingMethod = data.shippingMethod ?? null
		this.maxWidth = data.maxWidth ?? 0
		this.maxHeight = data.maxHeight ?? 0
		this.maxDepth = data.maxDepth ?? 0
		this.maxWeight = data.maxWeight ?? 0
		this.grade = data.grade ?? 0
		this.externalModuleName = data.externalModuleName ?? ""
		this.needRange = data.needRange ?? false
		this.position = data.position ?? 0
		this.delay = data.delay ?? ""

		if (validate) {
			const missing = []

			if (!this.name) {
				missing.push("name")
			}

			if (!this.delay) {
				missing.push("delay")
			}

			if (missing.length > 0) {
				throw new Error(`Missing required fields: ${missing.join(", ")}`)
			}
		}
	}

	static fromJSON(JsonData, validate) {
		return new Carrier(toXML(JsonData, validate))
	}

	static fromData(data) {
		const obj = Object.create(Carrier.prototype)
		Object.assign(obj, data)
		obj.endpoint = Carrier.prototype.endpoint ?? "carriers"
		return obj
	}

	async save() {
		const xml = await api.post(this.endpoint, toXML(this))
		return new Carrier(xml)
	}

	async getById(id) {
		const xml = await api.get(`${this.endpoint}/${id}`)
		return new Carrier(xml)
	}

	async update() {
		if (!this.id) {
			throw new Error("Cannot update a carrier without an ID")
		}

		const xml = await api.put(`${this.endpoint}/${this.id}`, toXML(this))
		return new Carrier(xml)
	}

	async delete() {
		if (!this.id) {
			throw new Error("Cannot delete a carrier without an ID")
		}

		await api.delete(`${this.endpoint}/${this.id}`)
	}

	async getAll() {
		const xml = await api.get(`${this.endpoint}?display=full`)
		const carriers = toJSONList(xml)

		return carriers.map((c) => Carrier.fromData(c))
	}

	async getAllApi(excludeIds = []) {
		const ids = (excludeIds ?? []).map(Number).filter(Number.isFinite)
		const filter = ids.length > 0 ? `&filter[id]=![${ids.join("|")}]` : ""
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const carriers = toJSONList(xml)

		return carriers.map((c) => Carrier.fromData(c))
	}

	async getExcl(excludeIds = []) {
		const excluded = new Set((excludeIds ?? []).map(Number))
		const all = await this.getAll()
		return all.filter((c) => !excluded.has(Number(c.id)))
	}

	async getIncl(includeIds = []) {
		const included = new Set((includeIds ?? []).map(Number))
		const all = await this.getAll()
		return all.filter((c) => included.has(Number(c.id)))
	}

	async getExclApi(excludeIds = []) {
		const ids = []
		for (const id of excludeIds ?? []) {
			const numericId = Number(id)

			if (Number.isFinite(numericId)) {
				ids.push(numericId)
			}
		}
		const filter = ids.length > 0 ? `&filter[id]=![${ids.join("|")}]` : ""
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const carriers = toJSONList(xml)
		return carriers.map((c) => Carrier.fromData(c))
	}

	async getInclApi(includeIds = []) {
		const ids = []
		for (const id of includeIds ?? []) {
			const numericId = Number(id)

			if (Number.isFinite(numericId)) {
				ids.push(numericId)
			}
		}
		const filter = ids.length > 0 ? `&filter[id]=[${ids.join("|")}]` : ""
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const carriers = toJSONList(xml)
		return carriers.map((c) => Carrier.fromData(c))
	}

	async getByNot(fieldName, value = this[fieldName]) {
		if (value === undefined || value === null || value === "") return await this.getAll()
		const all = await this.getAll()
		const values = toList(value)
		const normalized = new Set(values.map(String))

		return all.filter((item) => {
			const v = item[fieldName]
			if (v === undefined || v === null) return true
			if (Array.isArray(v)) return !v.map(String).some((iv) => normalized.includes(iv))
			return !normalized.includes(String(v))
		})
	}

	async getBy(fieldName, value = this[fieldName]) {
		if (value === undefined || value === null || value === "") return []
		const all = await this.getAll()
		const values = toList(value)
		const normalized = new Set(values.map(String))

		return all.filter((item) => {
			const v = item[fieldName]
			if (v === undefined || v === null) return false
			if (Array.isArray(v)) return v.map(String).some((iv) => normalized.has(iv))
			return normalized.has(String(v))
		})
	}

	async getByApi(fieldName, value = this[fieldName]) {
		const normalized = toList(value).map(String).map((v) => v.trim()).filter((s) => s !== "")

		if (normalized.length === 0) return []

		const filter = `&filter[${fieldName}]=[${normalized.join("|")}]`
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const carriers = toJSONList(xml)
		return carriers.map((c) => Carrier.fromData(c))
	}

	async getByNotApi(fieldName, value = this[fieldName]) {
		const normalized = toList(value).map(String).map((v) => v.trim()).filter((s) => s !== "")

		if (normalized.length === 0) return []

		const filter = `&filter[${fieldName}]=![${normalized.join("|")}]`
		const xml = await api.get(`${this.endpoint}?display=full${filter}`)
		const carriers = toJSONList(xml)
		return carriers.map((c) => Carrier.fromData(c))
	}

}

export default Carrier
