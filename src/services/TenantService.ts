import { Repository } from 'typeorm'
import { ITenantData } from '../types'
import { Tenant } from '../entity/Tenant'

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}
    async create(tenantData: ITenantData) {
        return await this.tenantRepository.save(tenantData)
    }

    async update(tenantId: number, updatedTenantData: ITenantData) {
        return await this.tenantRepository.update(tenantId, updatedTenantData)
    }

    async getOne(tenantId: number) {
        return await this.tenantRepository.findOne({ where: { id: tenantId } })
    }

    async getAll() {
        return await this.tenantRepository.find()
    }
    async deleteById(tenantId: number) {
        return await this.tenantRepository.delete(tenantId)
    }
}
