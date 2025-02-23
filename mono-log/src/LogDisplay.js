import React from 'react';
import { DataTable } from 'primereact/datatable/datatable.esm.js';
import { Column } from 'primereact/column/column.esm.js';
import { MultiSelect } from 'primereact/multiselect/multiselect.esm.js';
import { FilterMatchMode } from 'primereact/api/api.esm.js';

const defaultSort = [{ field: 'ms', order: -1 }];
const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

const bodyClassName = (rowData) => ({
    debug: 'text-blue-600',
    warn: 'text-yellow-600',
    error: 'text-red-600',
}[rowData.level]);

const FORMAT = Symbol('FORMAT');
const timeBody = (rowData) => (rowData.timestamp ?? new Date(rowData.ms - timezoneOffset).toISOString())?.replace('T', ' ').substring(5, 19);
const messageBody = (rowData) => rowData?.[FORMAT] ? <pre>{JSON.stringify(rowData, undefined, 2)}</pre> : JSON.stringify(rowData);

const filterElement = levels => (options) => {
    return (
        <MultiSelect
            value={options.value ?? ''}
            options={levels}
            // itemTemplate={representativesItemTemplate}
            onChange={(e) => options.filterApplyCallback(e.value)}
            optionLabel="name"
            placeholder="Any"
            className="p-column-filter"
            maxSelectedLabels={1}
            style={{ minWidth: '4rem' }}
        />
    );
};

const toggle = state => !state;

function useToggle(initialValue = false) {
    return React.useReducer(toggle, initialValue);
}

const filters = {
    level: { value: '', matchMode: FilterMatchMode.IN },
    context: { value: '', matchMode: FilterMatchMode.IN },
    component: { value: '', matchMode: FilterMatchMode.IN },
    type: { value: '', matchMode: FilterMatchMode.IN },
    method: { value: '', matchMode: FilterMatchMode.IN }
};

const LogDisplay = ({ logMessages }) => {

    const [refresh, toggleExpanded] = useToggle(false);

    const handleCellClick = React.useCallback((e) => {
        if (e.field === 'message') {
            e.rowData[FORMAT] = !e.rowData[FORMAT];
            toggleExpanded();
        }
    }, [refresh]);

    // collect unique values for context, component, type, and method
    const uniqueValues = React.useMemo(() => {
        const uniqueValues = {};
        logMessages.forEach((logMessage) => {
            Object.keys(filters).forEach(key => {
                if (logMessage[key]) {
                    uniqueValues[key] = uniqueValues[key] ?? new Set();
                    uniqueValues[key].add(logMessage[key]);
                }
            });
        });
        return uniqueValues;
    }, [logMessages]);

    const filterElements = React.useMemo(() => Object.keys(filters).reduce((options, key) => {
        if (uniqueValues[key]) {
            options[key] = filterElement(Array.from(uniqueValues[key]).map(value => ({ name: value, value })));
        }
        return options;
    }, {}), [Object.values(uniqueValues).map(set => Array.from(set).sort().join()).join()]);

    return (
        <div className="flex-1">
            <DataTable
                value={logMessages}
                sortMode="multiple"
                sortField="ms"
                multiSortMeta={defaultSort}
                size="small"
                scrollable
                scrollHeight="flex"
                showGridlines
                removableSort
                resizableColumns
                stateStorage="local"
                stateKey="mono-log"
                // rowClassName={rowClassName}
                filters={filters}
                filterDisplay="row"
                onCellClick={handleCellClick}
                cellSelection
            >
                <Column sortable style={{ width: "10rem" }} field="ms" header="Time"
                    body={timeBody}
                />
                <Column style={{ width: "10rem" }} field="level" header="Level"
                    filter
                    filterElement={filterElements.level}
                    showFilterMenu={false}
                    bodyClassName={bodyClassName}
                />
                <Column style={{ width: "10rem" }} field="context" header="Context"
                    filter
                    filterElement={filterElements.context}
                    showFilterMenu={false}
                />
                <Column style={{ width: "10rem" }} field="component" header="Component"
                    filter
                    filterElement={filterElements.component}
                    showFilterMenu={false}
                />
                <Column style={{ width: "10rem" }} field="type" header="Type"
                    filter
                    filterElement={filterElements.type}
                    showFilterMenu={false}
                />
                <Column style={{ width: "10rem" }} field="method" header="Method"
                    filter
                    filterElement={filterElements.method}
                    showFilterMenu={false}
                />
                <Column style={{ width: "10rem" }} field="message" header="Message" body={messageBody} />
            </DataTable>
        </div>
    );
};

export default LogDisplay;