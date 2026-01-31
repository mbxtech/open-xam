import {ICategory} from "../interfaces/category.interface";


export default class Category implements ICategory {
    id: number |null;
    name: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(category: ICategory) {
        this.id = category.id ?? null;
        this.name = category.name;
        this.createdAt = category.createdAt ?? new Date();
        this.updatedAt = category.updatedAt ?? new Date();
    }

    public static asNew(name: string): Category {
        return new Category({
            id: null,
            name,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
}