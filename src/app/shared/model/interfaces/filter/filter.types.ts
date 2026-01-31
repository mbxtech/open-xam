// Entspricht dem Rust enum ConjunctionType
export type ConjunctionType = 'AND' | 'OR';

// Entspricht dem Rust enum Operator
export type Operator =
    | 'EQ'
    | 'NE'
    | 'GT'
    | 'LT'
    | 'GE'
    | 'LE'
    | 'LIKE'
    | 'IN'
    | 'STARTS_WITH'
| 'ENDS_WITH';

// FilterValue - Tagged Union mit 'kind' als discriminator
export type FilterValue =
    | {
    kind: 'STR';
    value: string;
}
    | {
    kind: 'INT';
    value: number;
}
    | {
    kind: 'BOOL';
    value: boolean;
}
    | {
    kind: 'STR_LIST';
    values: string[];
}
    | {
    kind: 'INT_LIST';
    values: number[];
};

// FilterOption - Tagged Union mit 'type' als discriminator
export type FilterOption =
    | {
    type: 'GROUP';
    conjunction: ConjunctionType;
    filters: FilterOption[];
}
    | {
    type: 'CONDITION';
    field: string;
    operator: Operator;
    value: FilterValue;
};

export interface IFilterTree {
    root: FilterOption,
    conjunction?: ConjunctionType
}