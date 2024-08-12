export interface IRepository<Entity> {
    persist(entity: Entity): Promise<Entity>;
    findById(id: string): Promise<Entity | null>;
    findAll(): Promise<Entity[]>;
    merge(id: string, updatedEntity: Partial<Entity>): Promise<Entity | null>;
    removeById(id: string): Promise<Entity | null>;
}
