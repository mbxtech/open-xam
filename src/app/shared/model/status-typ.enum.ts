
export enum StatusType {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    DRAFT = 'DRAFT',
    ARCHIVED = 'ARCHIVED',
    DELETED = 'DELETED'
}

export const statusTypeSelectOptions = () => {
    const options: { value: any, label: string }[] = []
    options.push({value: StatusType.ACTIVE, label: $localize`:@@ox.statusType.ACTIVE:Active`});
    options.push({value: StatusType.INACTIVE, label: $localize`:@@ox.statusType.INACTIVE:Inactive`});
    options.push({value: StatusType.DRAFT, label: $localize`:@@ox.statusType.DRAFT:Draft`});
    options.push({value: StatusType.ARCHIVED, label: $localize`:@@ox.statusType.ARCHIVED:Archived`});
    options.push({value: StatusType.DELETED, label: $localize`:@@ox.statusType.DELETED:Deleted`});
    return options;
}