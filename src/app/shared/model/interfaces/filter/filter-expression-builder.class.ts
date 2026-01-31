import type { ConjunctionType, FilterOption, FilterValue, Operator, IFilterTree } from '../../interfaces/filter/filter.types';

/**
 * Builder zum Erstellen von FilterOption-Bäumen (GROUP/CONDITION) inkl. aller Value-Kombinationen
 * + Helpers zum Bauen von IFilterTree-Listen.
 */
export class FilterExpressionBuilder {
    /**
     *  Entrypoint: Condition-Builder
     *  @param field Needs to be names as the database column.
     *  @return ConditionBuilder {@see ConditionBuilder}
     * */
    static cond(field: string): ConditionBuilder {
        return new ConditionBuilder(field);
    }

    /**
     * Entrypoint: GROUP (AND)
     * @param filters List of filters of type FilterOption, ConditionBuilder, or GroupBuilder.
     * @return GroupBuilder {@see GroupBuilder}
     * */
    static and(filters: Array<FilterOption | GroupBuilder | ConditionBuilder>): GroupBuilder {
        return new GroupBuilder('AND').filters(filters);
    }

    /**
     * Entrypoint: GROUP (OR)
     * @param filters List of filters of type FilterOption, ConditionBuilder, or GroupBuilder.
     * @return GroupBuilder {@see GroupBuilder}
     * */
    static or(filters: Array<FilterOption | GroupBuilder | ConditionBuilder>): GroupBuilder {
        return new GroupBuilder('OR').filters(filters);
    }

    /**
     * Wrapping an Expression (FilterOption) into an IFilterTree
     * @param root FilterOption, ConditionBuilder, or GroupBuilder.
     * @param conjunction Optional conjunction type. Defaults to AND.
     * @return IFilterTree {@see IFilterTree}
     * */
    static tree(
        root: FilterOption | GroupBuilder | ConditionBuilder,
        conjunction?: ConjunctionType
    ): IFilterTree {
        const builtRoot =
            root instanceof GroupBuilder || root instanceof ConditionBuilder ? root.build() : root;

        return conjunction ? { root: builtRoot, conjunction } : { root: builtRoot };
    }

    /** Start of creating a list of trees.*/
    static trees(): FilterTreeListBuilder {
        return new FilterTreeListBuilder();
    }

    /** Value helper: string */
    static str(value: string): FilterValue {
        return { kind: 'STR', value };
    }

    /** Value helper: number */
    static int(value: number): FilterValue {
        return { kind: 'INT', value };
    }

    /** Value helper: boolean */
    static bool(value: boolean): FilterValue {
        return { kind: 'BOOL', value };
    }

    /** Value helper: string[] */
    static strList(values: string[]): FilterValue {
        return { kind: 'STR_LIST', values };
    }

    /** Value helper: number[] */
    static intList(values: number[]): FilterValue {
        return { kind: 'INT_LIST', values };
    }

    /** Falls du irgendwo bereits ein FilterOption hast, kannst du es “durchreichen”. */
    static from(filter: FilterOption): FilterOption {
        return filter;
    }
}

export class FilterTreeListBuilder {
    private readonly _trees: IFilterTree[] = [];

    /**
     * Fügt einen Tree hinzu.
     * `conjunction` ist optional und wird (wie in deinem Typ) pro Tree gespeichert.
     */
    add(
        root: FilterOption | GroupBuilder | ConditionBuilder,
        conjunction?: ConjunctionType
    ): FilterTreeListBuilder {
        this._trees.push(FilterExpressionBuilder.tree(root, conjunction));
        return this;
    }

    /**
     * Sugar: fügt den Tree hinzu und setzt dessen `conjunction` auf AND.
     * (nützlich, wenn dieser Tree mit dem vorherigen logisch verknüpft werden soll)
     */
    and(root: FilterOption | GroupBuilder | ConditionBuilder): FilterTreeListBuilder {
        return this.add(root, 'AND');
    }

    /** Sugar: wie and(), nur OR */
    or(root: FilterOption | GroupBuilder | ConditionBuilder): FilterTreeListBuilder {
        return this.add(root, 'OR');
    }

    build(): IFilterTree[] {
        return [...this._trees];
    }
}

export class GroupBuilder {
    private readonly _filters: FilterOption[] = [];

    constructor(private readonly _conjunction: ConjunctionType) {}

    conjunction(conjunction: ConjunctionType): GroupBuilder {
        return new GroupBuilder(conjunction).filters(this._filters);
    }

    /**
     * Akzeptiert fertige FilterOption oder andere Builder (Group/Condition).
     * Leere/undefined werden ignoriert (praktisch für optionale UI-Filter).
     */
    filters(filters: Array<FilterOption | GroupBuilder | ConditionBuilder | null | undefined>): GroupBuilder {
        for (const f of filters) {
            if (!f) continue;

            if (f instanceof GroupBuilder || f instanceof ConditionBuilder) {
                this._filters.push(f.build());
            } else {
                this._filters.push(f);
            }
        }
        return this;
    }

    add(filter: FilterOption | GroupBuilder | ConditionBuilder | null | undefined): GroupBuilder {
        return this.filters([filter]);
    }

    build(): FilterOption {
        return {
            type: 'GROUP',
            conjunction: this._conjunction,
            filters: [...this._filters],
        };
    }
}

export class ConditionBuilder {
    private _operator: Operator | null = null;
    private _value: FilterValue | null = null;

    constructor(private readonly _field: string) {}

    field(field: string): ConditionBuilder {
        const next = new ConditionBuilder(field);
        next._operator = this._operator;
        next._value = this._value;
        return next;
    }

    operator(operator: Operator): ConditionBuilder {
        this._operator = operator;
        return this;
    }

    value(value: FilterValue): ConditionBuilder {
        this._value = value;
        return this;
    }

    // --- Operator-Shortcuts: decken alle Operatoren ab ---

    eq(value: FilterValue): ConditionBuilder {
        return this.operator('EQ').value(value);
    }

    ne(value: FilterValue): ConditionBuilder {
        return this.operator('NE').value(value);
    }

    gt(value: FilterValue): ConditionBuilder {
        return this.operator('GT').value(value);
    }

    lt(value: FilterValue): ConditionBuilder {
        return this.operator('LT').value(value);
    }

    ge(value: FilterValue): ConditionBuilder {
        return this.operator('GE').value(value);
    }

    le(value: FilterValue): ConditionBuilder {
        return this.operator('LE').value(value);
    }

    like(value: FilterValue): ConditionBuilder {
        return this.operator('LIKE').value(value);
    }

    startsWith(value: FilterValue): ConditionBuilder {
        return this.operator('STARTS_WITH').value(value);
    }

    endsWith(value: FilterValue): ConditionBuilder {
        return this.operator('ENDS_WITH').value(value);
    }

    in(value: FilterValue): ConditionBuilder {
        return this.operator('IN').value(value);
    }

    // --- Typische Value-Shortcuts (alle FilterValue-Kombinationen abgedeckt) ---

    eqStr(v: string): ConditionBuilder {
        return this.eq(FilterExpressionBuilder.str(v));
    }

    eqInt(v: number): ConditionBuilder {
        return this.eq(FilterExpressionBuilder.int(v));
    }

    eqBool(v: boolean): ConditionBuilder {
        return this.eq(FilterExpressionBuilder.bool(v));
    }

    inStrList(v: string[]): ConditionBuilder {
        return this.in(FilterExpressionBuilder.strList(v));
    }

    inIntList(v: number[]): ConditionBuilder {
        return this.in(FilterExpressionBuilder.intList(v));
    }

    build(): FilterOption {
        if (!this._operator) {
            throw new Error(`ConditionBuilder: operator fehlt für field="${this._field}"`);
        }
        if (!this._value) {
            throw new Error(`ConditionBuilder: value fehlt für field="${this._field}" operator="${this._operator}"`);
        }

        return {
            type: 'CONDITION',
            field: this._field,
            operator: this._operator,
            value: this._value,
        };
    }
}